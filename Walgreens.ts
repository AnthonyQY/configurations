import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Walgreens',
  category: 'walgreens',
  priceReplacementRegex: /[^\d.-]/g,
  hasCashBack: false,
  product: {
    pageMatchRegexp: /-product/,
    nameSelector: '#productTitle',
    imageSelector: '#productImg',
    priceSelector: '#regular-price-info, #sales-price-info',
  },
  coupons: {
    applyStyles: false,
    activationStyles: ``,
    inputSelector: 'input#wag-cart-enter-code',
    submitSelector: '#wag-cart-apply-code',
    submission: {
      waitForElementSelector: '#wag-cart-loading-icon',
    },
  },
  cart: {
    pageMatchRegexp: /cart/,
    couponCodeSelector: '#wag_cart_promo_container',
    summaryContainer: '#wag_cart_order_summary_container',
    subtotalPriceSelector: `#wag-cart-item-subtotal .f-right`,
    totalPriceSelector: `.wag-cart-order-price-tax .f-right .product__price strong`,
  },
  checkout: {
    pageMatchRegexp: /retailcheckout/,
    thankYouPageMatchRegexp:
      /(?:store\/checkout\/confirmorder_sdd\.jsp|rx-checkout\/prescription-confirmation|ordercapture\/order-ui\?checkout)/,
    summaryContainer: '#wag_cart_order_summary_container, #wag-checkout-order-summary-details',
    subtotalPriceSelector: `#wag-cart-item-subtotal .f-right, #wag-checkout-item-subtotal .f-right`,
    totalPriceSelector: `.wag-cart-order-price-tax .f-right .product__price strong`,
  },
};

export class Walgreens extends BaseWebsite {
  protected config = config;

  async beforeApplyCoupons() {
    await this.waitForElement('label[for="wag-cart-enter-code"]');
    const label = document.querySelector<HTMLInputElement>('label[for="wag-cart-enter-code"]');
    if (label) {
      label.style.display = 'none';
    }

    const shipOptionTitle = document.querySelector<HTMLElement>('.wag-cart-ship-option-title section:nth-child(4)');

    if (shipOptionTitle) {
      shipOptionTitle.style.whiteSpace = 'nowrap';
    }

    await this.waitForElement('#wag-cart-enter-code');
    const input = document.querySelector<HTMLInputElement>('#wag-cart-enter-code');
    if (input) {
      input.value = '';
      input.style.background = '#fff';
      input.style.color = '#fff';
    }

    await this.waitForElement('#wag-cart-loading-icon');
    const loader = document.querySelector('#wag-cart-loading-icon') as HTMLElement;
    if (loader) {
      loader.style.zIndex = '-1';
    }

    await this.waitForElement('#wag-cart-promo-code-desc');
    const error = document.querySelector<HTMLSpanElement>('#wag-cart-promo-code-desc');

    if (error) {
      error.style.display = 'none';
    }
  }

  public async parseCheckoutPrice(): Promise<{ subtotalPrice: number; totalPrice: number }> {
    // eslint-disable-next-line prefer-const
    let { subtotalPrice, totalPrice } = await super.parseCheckoutPrice();
    const productPriceEl = document.querySelector('.product__price .sr-only');

    if (productPriceEl) {
      totalPrice =
        Number(
          productPriceEl.textContent?.trim()?.replace(' and ', '.').replace(this.config.priceReplacementRegex, ''),
        ) || 0;
    }

    return {
      subtotalPrice,
      totalPrice,
    };
  }

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    try {
      const websiteData = document.querySelector('script[type="application/ld+json"]')?.textContent as string;
      const gtin = JSON.parse(websiteData)?.gtin;

      return gtin?.substring(gtin.length - 13);
    } catch (e) {
      return null;
    }
  }
}
