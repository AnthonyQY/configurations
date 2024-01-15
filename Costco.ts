import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Costco',
  category: 'costco',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /product/,
    nameSelector: 'h1[itemprop="name"]',
    imageSelector: '#productImage',
    priceSelector: '#pull-right-price .value',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      #enter-promo-code-input {
        color: #fff !important;
      }
      
      #promo-code-label,
      #promo-code-error,
      #promo-code-success {
        display: none !important;
      }
    `,
    inputSelector: '#enter-promo-code-input',
    submitSelector: 'input[name="apply-promo"]',
    submission: {
      waitForElementSelector: '#promo-code-form', // #order-summary.ajax-busy
    },
  },
  cart: {
    pageMatchRegexp: /^\/CheckoutCartDisplayView/,
    summaryContainer: '#order-summary-body',
    totalPriceSelector: '#order-estimated-total',
  },
  checkout: {
    pageMatchRegexp: /CheckoutCartDisplayView|SinglePageCheckoutView/,
    thankYouPageMatchRegexp: /CheckoutConfirmationView/,
    couponCodeSelector: '#order-summary-body',
    summaryContainer: '#order-summary-body',
    subtotalPriceSelector: `#subtotal-value`,
    totalPriceSelector: `.surchargeOrderTotal, #order-estimated-total`,
  },
};
export class Costco extends BaseWebsite {
  protected config = config;

  getDatafinityQuery(): string | null {
    const manufacturerNumber = this.parseManufacturerNumber();

    return manufacturerNumber ? `manufacturerNumber:${manufacturerNumber}` : null;
  }

  parseManufacturerNumber() {
    const element = document.querySelector('#product-body-model-number span');
    if (element) {
      const gtin = element.textContent;
      if (gtin) {
        return gtin.replaceAll('/', '');
      }
    }
    return null;
  }
}
