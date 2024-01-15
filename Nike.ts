import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';
import type { Coupon } from '~types/coupon';

const config: WebsiteConfig = {
  name: 'Nike',
  category: 'nike',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/t\//,
    nameSelector: '#pdp_product_title',
    imageSelector: 'img[data-testid="HeroImg"]',
    priceSelector: 'div[data-test="product-price"]',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      .section-overwrap,
      div[data-automation="cart-error-dialog"] {
        opacity: 0 !important;
      }
    `,
    inputSelector: '#promo-codes form input, #promoCode',
    submitSelector: 'button[data-automation="promo-code-apply-button"], button[data-attr="qa-promocode"]',
    submission: {
      waitForElementSelector: '.modal-container',
    },
  },
  cart: {
    pageMatchRegexp: /cart/,
    couponCodeSelector: 'div[data-automation="promo-code-line-item"]',
    summaryContainer: 'aside[data-automation="cart-summary"]',
    subtotalPriceSelector: `div[data-automation="summary-subtotal"] span span, [data-attr="subtotal"]`,
    totalPriceSelector: `[data-automation="summary-total"], [data-attr="cart-total"]`,
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp: /checkout.*#orderconfirmation/,
    couponCodeSelector: '[data-attr="test-promotions"]',
    summaryContainer: 'aside[data-automation="cart-summary"], [data-attr="summaryComponent"]',
    subtotalPriceSelector: `div[data-automation="summary-subtotal"] span span, [data-attr="subtotal"]`,
    totalPriceSelector: `[data-automation="summary-total"], [data-attr="cart-total"]`,
  },
};

export class Nike extends BaseWebsite {
  protected config = config;

  beforeApplyCoupons() {
    const checkbox = document.querySelector('#prepaidCard') as HTMLInputElement;

    if (checkbox) {
      checkbox.click();
    }
  }

  async detectAppliedCoupon(coupons: any) {
    let couponsRegex: RegExp | null = null;
    const {
      checkout,
      cart,
      coupons: { fuzzyMatch },
    } = this.config;

    const codeSelector = this.isCartPage() ? cart.couponCodeSelector : checkout.couponCodeSelector;

    if (!codeSelector) {
      return null;
    }

    if (this.isCartPage()) {
      const couponCodeSelector = cart.couponCodeSelector;
      const contentWithCoupons = this.getTextContent(couponCodeSelector as string).toLowerCase();

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
    }

    if (this.isCheckoutPage()) {
      const couponCodeSelector = checkout.couponCodeSelector as string;
      await this.waitForElement(couponCodeSelector);
      const text = (document.querySelector(couponCodeSelector) as HTMLElement)?.innerText;
      const matches = text.match(/\d+/);
      const percentage = matches && parseInt(matches[0]).toString();

      return {
        percentage_value: percentage,
        store: 'nike.com',
      };
    }

    return null;
  }

  async removeStyles() {
    super.removeStyles();

    await this.waitForElement('button[data-automation-id="error-close"]');

    const button = document.querySelector('button[data-automation-id="error-close"]') as HTMLButtonElement;

    if (button) {
      button.click();
    }
  }

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    try {
      const data = JSON.parse(document.getElementById('__NEXT_DATA__')?.textContent as string);
      const products: any = Object.values(data?.props?.pageProps?.initialState?.Threads?.products);

      return products ? products[0].skus[0].gtin : null;
    } catch (e) {
      return null;
    }
  }
}
