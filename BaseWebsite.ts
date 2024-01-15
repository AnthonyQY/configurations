import { TEST_COUPON_CODE } from '~constants/coupons';
import { Logger } from '~services/Logger';
import type { WebsiteConfig } from '~services/website/types';
import type { AppGetState } from '~store';
import type { Coupon } from '~types/coupon';
import type { Product } from '~types/product';

type OrderSummary = {
  subtotalPrice: number;
  totalPrice: number;
};

export abstract class BaseWebsite {
  protected abstract config: WebsiteConfig;
  protected logger = Logger.create('BaseWebsite');
  protected orderSummaryObserver: MutationObserver | null = null;

  // https://portal.datafiniti.co/product-data
  abstract getDatafinityQuery(): string | null;

  protected beforeApplyCoupons() {
    // Do nothing by default
  }

  public getCategory(): string {
    return this.config.category;
  }

  public getName(): string {
    return this.config.name;
  }

  public getUrl(): string {
    return `${window.location.protocol}//${this.getHost()}`;
  }

  public getHost(): string {
    const [zone, name] = window.location.host.split('.').reverse();
    return `${name}.${zone}`;
  }

  protected addStyles(): void {
    const { coupons } = this.config;

    const styleTag = document.createElement('style');
    styleTag.id = 'redeemer-styles';

    if (this.config.coupons.applyStyles) {
      styleTag.appendChild(document.createTextNode(coupons.activationStyles));
    }
    document.head.appendChild(styleTag);
  }
  public removeStyles(): void {
    const styleTag = document.getElementById('redeemer-styles');

    if (styleTag && styleTag.parentNode) {
      styleTag.parentNode.removeChild(styleTag);
    }
  }

  public async applyCoupons(coupons: Coupon[], { getState }: { getState: AppGetState }): Promise<void> {
    const {
      coupons: { inputSelector, submitSelector, submission },
    } = this.config;
    this.addStyles();

    this.beforeApplyCoupons();

    for (const coupon of coupons) {
      this.logger.info('Applying coupon', coupon.code);

      const styleTag = document.getElementById('redeemer-styles');

      if (!styleTag) {
        return Promise.reject({ aborted: true });
      }

      this.logger.info('Waiting for input and apply button');
      await this.waitForElement(inputSelector);
      await this.waitForElement(submitSelector);
      const input = document.querySelector<HTMLInputElement>(inputSelector);
      const applyBtn = document.querySelector<HTMLInputElement>(submitSelector);

      if (!input || !applyBtn) {
        this.logger.warn(`%cForm for coupons not found`, 'background: red;color:white;');

        return Promise.reject({
          reason: 'INVALID_FORM',
          meta: {
            input,
            applyBtn,
          },
        });
      }

      const inputEvent = new Event('input', { bubbles: true });
      input.value = coupon.code;
      input.dispatchEvent(inputEvent);
      this.logger.info('Submitting coupon');
      applyBtn.disabled = false;
      applyBtn.click();

      // Select the target element you want to watch
      this.logger.info('Waiting when loading is finished');
      await this.waitForElement(submission.waitForElementSelector);
      await this.waitForElementToDisappear(submission.waitForElementSelector);

      const { appliedCoupon } = getState().savings;

      this.logger.info('Checking if coupon is applied', appliedCoupon);

      if (appliedCoupon) {
        return this.removeStyles();
      }
    }

    // Wait until UI applies all the changes
    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.removeStyles();
  }

  public async checkCouponValidity(appliedCoupon: Coupon): Promise<boolean> {
    this.logger.log('Checking coupon validity', appliedCoupon.code);

    if (appliedCoupon.code === TEST_COUPON_CODE) {
      return true;
    }

    const {
      checkout,
      cart,
      coupons: { fuzzyMatch },
    } = this.config;

    const couponCodeSelector = this.isCartPage() ? cart.couponCodeSelector : checkout.couponCodeSelector;

    if (!couponCodeSelector) {
      return true;
    }

    await this.waitForElement(couponCodeSelector);
    const contentWithCoupons = this.getTextContent(couponCodeSelector).toLowerCase();

    let isValid = false;

    if (fuzzyMatch) {
      isValid = this.fuzzyMatchCouponCode(contentWithCoupons, appliedCoupon);
    } else {
      isValid = new RegExp(appliedCoupon.code.toLowerCase()).test(
        this.getTextContent(couponCodeSelector).toLowerCase(),
      );
    }

    this.logger.log('Coupon validity', isValid);

    return isValid;
  }

  // eslint-disable-next-line
  public observeThankYouPage(cb: () => void) {}

  // TODO: Check performance for SPA websites
  public observeOrderSummary(cb: (orderSummary: OrderSummary) => void) {
    this.createOrderSummaryObserver(async () => {
      const orderSummary = await (this.isCartPage() ? this.parseCartPrice() : this.parseCheckoutPrice());

      cb(orderSummary);
    });
  }

  private async createOrderSummaryObserver(cb: () => void) {
    const { checkout, cart } = this.config;
    const summaryContainer = this.isCartPage() ? cart.summaryContainer : checkout.summaryContainer;

    // Select the node that will be observed for mutations
    await this.waitForElement(summaryContainer);
    const targetNode = document.querySelector(summaryContainer);

    if (!targetNode) {
      this.logger.error(`%cTarget node not found ${summaryContainer}`, 'background: red;color:white;');
      return null;
    }

    cb();

    this.orderSummaryObserver?.disconnect();
    // Create an observer instance linked to the callback function
    this.orderSummaryObserver = new MutationObserver(cb);

    // Start observing the target node for configured mutations
    this.orderSummaryObserver.observe(targetNode, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });

    return this.orderSummaryObserver;
  }

  hasCoupons(): boolean {
    const { checkout, cart } = this.config;

    return Boolean(this.isCartPage() ? cart.couponCodeSelector : checkout.couponCodeSelector);
  }

  public async parseCheckoutPrice(): Promise<{ subtotalPrice: number; totalPrice: number }> {
    if (this.isCartPage()) {
      return this.parseCartPrice();
    }

    const { subtotalPriceSelector, totalPriceSelector } = this.config.checkout;
    await this.waitForElement(subtotalPriceSelector);
    await this.waitForElement(totalPriceSelector);

    return {
      subtotalPrice: this.getPriceFromElement(subtotalPriceSelector),
      totalPrice: this.getPriceFromElement(totalPriceSelector),
    };
  }

  public async parseCartPrice(): Promise<{ subtotalPrice: number; totalPrice: number }> {
    const { subtotalPriceSelector, totalPriceSelector } = this.config.cart;

    if (subtotalPriceSelector) {
      await this.waitForElement(subtotalPriceSelector);
    }

    if (totalPriceSelector) {
      await this.waitForElement(totalPriceSelector);
    }

    return {
      subtotalPrice: subtotalPriceSelector ? this.getPriceFromElement(subtotalPriceSelector) : 0,
      totalPrice: totalPriceSelector ? this.getPriceFromElement(totalPriceSelector) : 0,
    };
  }

  public async parseCheckoutDiscount(): Promise<number | null> {
    if (this.isCartPage()) {
      return this.parseCartDiscount();
    }

    const { discountSelector } = this.config.checkout;

    if (!discountSelector) {
      return Promise.resolve(null);
    }

    await this.waitForElement(discountSelector);

    return this.getPriceFromElement(discountSelector as string);
  }

  public async parseCartDiscount(): Promise<number | null> {
    const { discountSelector } = this.config.cart;

    if (!discountSelector) {
      return Promise.resolve(null);
    }

    await this.waitForElement(discountSelector);

    return this.getPriceFromElement(discountSelector);
  }

  public isCheckoutPage(): boolean {
    const {
      checkout: { pageMatchRegexp },
    } = this.config;

    if (pageMatchRegexp) {
      return pageMatchRegexp.test(window.location.pathname + window.location.search);
    }

    return false;
  }

  public isCartPage(): boolean {
    const {
      cart: { pageMatchRegexp },
    } = this.config;

    if (pageMatchRegexp) {
      return pageMatchRegexp.test(window.location.pathname + window.location.search);
    }

    return false;
  }

  public isCheckoutOrCartPage(): boolean {
    return this.isCheckoutPage() || this.isCartPage();
  }

  public isThankYouPage(): boolean {
    const {
      checkout: { thankYouPageMatchRegexp },
    } = this.config;

    if (thankYouPageMatchRegexp) {
      return thankYouPageMatchRegexp.test(window.location.pathname + window.location.search);
    }

    return false;
  }

  public async getProduct(): Promise<Omit<Product, 'price'>> {
    const time = Date.now();
    const { product } = this.config;

    await this.waitForElement(product.nameSelector);
    if (Date.now() - time > 1000) {
      this.logger.warn('Waiting for nameSelector took more than 1 second');
    }
    await this.waitForElement(product.imageSelector);
    if (Date.now() - time > 1000) {
      this.logger.warn('Waiting for imageSelector took more than 1 second');
    }

    const image = document.querySelector(product.imageSelector);
    const srcRegex = /[^\s]+(?=\s|$)/;

    return {
      name: this.getTextContent(product.nameSelector),
      image: image?.getAttribute('src') || (image?.getAttribute('srcset')?.match(srcRegex) || [])[0] || '',
    };
  }

  public async getProductPrice(): Promise<number> {
    const { product } = this.config;

    const priceSelectors = product.priceSelector.split(',');
    const priceSelector = priceSelectors.find((selector) => document.querySelector(selector)?.textContent?.trim());

    return priceSelector ? this.getPriceFromElement(priceSelector) : 0;
  }

  public isProductPage(): boolean {
    const {
      product: { pageMatchRegexp },
    } = this.config;

    if (pageMatchRegexp) {
      return pageMatchRegexp.test(window.location.pathname + window.location.search);
    }

    return false;
  }

  protected waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      let timer: any = 0;

      if (element) {
        clearTimeout(timer);
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutationsList, observer) => {
        const foundElement = document.querySelector(selector);

        if (foundElement) {
          clearTimeout(timer);
          observer.disconnect();
          resolve(foundElement);
        }
      });

      timer = setTimeout(() => {
        this.logger.warn(`%cTimeout reached for element ${selector}`, 'background: red;color:white;');

        observer.disconnect();
        resolve(null);
      }, timeout);

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    });
  }

  protected waitForElementToDisappear(selector: string, timeout = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      let timer: any = 0;

      if (!element) {
        clearTimeout(timer);
        resolve(true);
        return;
      }

      const observer = new MutationObserver((mutationsList, observer) => {
        if (!document.querySelector(selector)) {
          clearTimeout(timer);
          observer.disconnect();
          resolve(true);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });

      timer = setTimeout(() => {
        this.logger.warn('Timeout reached for waiting for element to disappear', selector);
        observer.disconnect();
        resolve(false);
      }, timeout);
    });
  }

  public couponCodeSelectorIsDisabled() {
    return false;
  }

  public async detectAppliedCoupon(coupons: Coupon[]) {
    let couponsRegex: RegExp | null = null;
    const {
      checkout,
      cart,
      coupons: { fuzzyMatch },
    } = this.config;

    const couponCodeSelector = this.isCartPage() ? cart.couponCodeSelector : checkout.couponCodeSelector;

    if (!couponCodeSelector) {
      return null;
    }

    const contentWithCoupons = this.getTextContent(couponCodeSelector).toLowerCase();

    if (fuzzyMatch) {
      const coupon = coupons.find((coupon: Coupon) => this.fuzzyMatchCouponCode(contentWithCoupons, coupon));

      if (coupon) {
        return coupon;
      }
    }

    if (coupons?.length) {
      couponsRegex = new RegExp((coupons || []).map((coupon: Coupon) => coupon.code.toLowerCase()).join('|'));
    }

    if (couponsRegex) {
      this.logger.log('detectAppliedCoupon.couponsRegex', {
        couponsRegex,
        contentWithCoupons,
      });

      if (couponsRegex.test(contentWithCoupons)) {
        return coupons?.find((coupon: Coupon) => new RegExp(coupon.code.toLowerCase()).test(contentWithCoupons));
      }
    }

    return null;
  }

  protected getTextContent(selector: string): string {
    return document.querySelector(selector)?.textContent?.trim() || '';
  }

  protected getPriceFromElement(selector: string): number {
    const text = this.getTextContent(selector);

    this.logger.info('BaseWebsite.getPriceFromElement', { selector, text });

    return this.getNumericPrice(text);
  }

  protected getNumericPrice(text: string): number {
    return Number(text.replace(this.config.priceReplacementRegex, ''));
  }

  protected fuzzyMatchCouponCode(text: string, coupon: Coupon) {
    const textLower = text.toLowerCase();
    const codeWords = coupon.code.toLowerCase().split(/(\d+)/).filter(Boolean);

    return codeWords.every((codeWord) => textLower.includes(codeWord));
  }
}
