import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Chewy',
  category: 'chewy',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /dp/,
    nameSelector: '.styles_productName__vSdxx',
    imageSelector: '.styles_mainCarouselImage__wj_bU',
    priceSelector: 'div[data-testid="advertised-price"]',
  },
  coupons: {
    applyStyles: true,
    fuzzyMatch: true,
    activationStyles: `
      #add-promo-code-textbox {
        border-color: #ccc;
        color: #fff;
        box-shadow: none;
      }
      
      .kib-form-messaging__item.kib-form-messaging__item--error,
      label[for="add-promo-code-textbox"] {
        display: none;
      }
    `,
    inputSelector: '#add-promo-code-textbox',
    submitSelector: '.sp-checkout-promocode-apply',
    submission: {
      waitForElementSelector: '.kib-loader__section',
    },
  },
  cart: {
    pageMatchRegexp: /^\/app\/cart/,
    summaryContainer: '[class*="sticky-card_card"]',
    subtotalPriceSelector: '[class*="cart-summary-subtotal_value"]',
  },
  checkout: {
    pageMatchRegexp: /cart|app\/checkout/,
    thankYouPageMatchRegexp: /.*\/app\/checkout\/thankyou\?orderId.*/,
    couponCodeSelector: 'div[data-qa-id="discount-label-value"] span[data-qa-id="discount-label"]',
    summaryContainer: '.sp-checkout-summary',
    subtotalPriceSelector: `[data-qa-id="subtotal-value"]`,
    totalPriceSelector: `[data-qa-id="order-total-value"]`,
  },
};
export class Chewy extends BaseWebsite {
  protected config = config;

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    try {
      const scriptElement = document.querySelector('script[type="application/ld+json"]');
      if (scriptElement) {
        const json = JSON.parse(scriptElement.innerHTML);

        return json.gtin12 || json[0].gtin12;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
