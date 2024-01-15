import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Bloomingdales',
  category: 'bloomingdales',
  priceReplacementRegex: /-?[^\d.-]/g,
  hasCashBack: false,
  product: {
    pageMatchRegexp: /\/shop\/.*\?ID=\d+/,
    nameSelector: '.brand-name-container div.b-breakword',
    imageSelector: '.main-image-img',
    priceSelector: '.price-lg span',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      .section-overwrap,
      .promo-error,
      #promo-error-msg {
        display: none !important;
      }

      #promo-apply-input  {
         color: white !important;
         border: 1px solid #888C8C !important;
         box-shadow: 0 1px 2px rgba(15,17,17,.15) inset !important;
      }

      [for="promo-apply-input"] {
        display: none !important;
        }

      .promo-apply-button .loader-wrapper {
        display: none !important;
      }
    `,
    inputSelector: 'input#promo-apply-input',
    submitSelector: '.promo-apply-button',
    submission: {
      waitForElementSelector: '.promo-apply-button.button.has-loader.btn-hide-txt',
    },
  },
  cart: {
    pageMatchRegexp: /^\/my-bag/,
    couponCodeSelector: '.promotions-summary .promotion-applied',
    discountSelector: '.promo-applied-discount.PROMOTION_MANUAL_SAVE',
    subtotalPriceSelector: '#cx-at-SUM_SUB_TOTAL-value',
    summaryContainer: '#bag-right-container',
    totalPriceSelector: `
      #cx-at-GRAND_TOTAL-value
    `,
  },
  checkout: {
    pageMatchRegexp: /^\/my-checkout/,
    discountSelector: '#rc-promo-details-manual .rc-promo-manual-item .rc-promotion.align-right',
    // https://www.bloomingdales.com/my-checkout?segment=1139-21,981-21,663-23,1112-21,965-21,1110-11,1030-21,1182-21,1060-21
    thankYouPageMatchRegexp: /^\/my-checkout\?segment=/,
    summaryContainer: '#bagMain, #order-summary',
    subtotalPriceSelector: `#rc-order-subtotal .grid-x.align-right, #cx-at-SUM_SUB_TOTAL-value`,
    totalPriceSelector: `#rc-order-grandtotal, #cx-at-GRAND_TOTAL-value div`,
  },
};

export class Bloomingdales extends BaseWebsite {
  protected config = config;

  private thankYouPageObserver: MutationObserver | null = null;

  getDatafinityQuery(): string | null {
    const sku = this.parseSKU();

    if (!sku) {
      return null;
    }

    const gtin = `000${sku}`;

    return `gtins:${gtin.substring(gtin.length - 13)}`;
  }

  parseSKU() {
    return JSON.parse(
      document.querySelector('script#productSEOData[type="application/ld+json"]')?.textContent as string,
    )[1].offers[0].SKU.replace('USA', '');
  }

  async parseCheckoutPrice(): Promise<{ subtotalPrice: number; totalPrice: number }> {
    if (this.isCartPage()) {
      return this.parseCartPrice();
    }

    const { subtotalPriceSelector, totalPriceSelector, discountSelector } = this.config.checkout;

    await this.waitForElement(subtotalPriceSelector);
    await this.waitForElement(totalPriceSelector);

    return {
      subtotalPrice:
        this.getPriceFromElement(subtotalPriceSelector) +
        this.getNumericPrice(this.getTextContent(discountSelector as string)),
      totalPrice: this.getPriceFromElement(totalPriceSelector),
    };
  }

  async parseCartPrice(): Promise<{ subtotalPrice: number; totalPrice: number }> {
    const { subtotalPriceSelector, totalPriceSelector, discountSelector } = this.config.cart;

    if (subtotalPriceSelector) {
      await this.waitForElement(subtotalPriceSelector);
    }

    if (totalPriceSelector) {
      await this.waitForElement(totalPriceSelector);
    }

    return {
      subtotalPrice: subtotalPriceSelector
        ? this.getPriceFromElement(subtotalPriceSelector) +
          this.getNumericPrice(this.getTextContent(discountSelector as string))
        : 0,
      totalPrice: totalPriceSelector ? this.getPriceFromElement(totalPriceSelector) : 0,
    };
  }

  public isThankYouPage(): boolean {
    return super.isThankYouPage() && !!document.getElementById('rc-at-order-number');
  }

  public observeThankYouPage(cb: () => void) {
    this.thankYouPageObserver?.disconnect();

    this.thankYouPageObserver = new MutationObserver((mutationsList, observer) => {
      const foundElement = document.getElementById('rc-at-order-number');

      if (foundElement) {
        cb();

        observer.disconnect();
      }
    });

    this.thankYouPageObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id'],
    });
  }
}
