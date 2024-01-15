import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Macys',
  category: 'macys',
  priceReplacementRegex: /[^\d.-]/g,
  hasCashBack: false,
  product: {
    pageMatchRegexp: /product/,
    nameSelector: 'div[data-auto="product-name"]',
    imageSelector: '.main-picture img',
    priceSelector: '.lowest-sale-price span',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      .section-overwrap,
      #promo-error-msg,
      label[for="promo-apply-input"] {
        display: none !important;
      }
      
      #promo-apply-input {
        color: #fff !important;
      }
    `,
    inputSelector: '#promo-apply-input',
    submitSelector: '.promo-apply-button',
    submission: {
      waitForElementSelector: '.promo-apply-button',
    },
  },
  cart: {
    pageMatchRegexp: /my-bag/,
    couponCodeSelector: '.promotion-applied ',
    summaryContainer: '#order-summary-wrapper',
    subtotalPriceSelector: `#cx-at-SUM_SUB_TOTAL-value, #rc-order-subtotal`,
    totalPriceSelector: `#cx-at-GRAND_TOTAL-value, #rc-order-grandtotal`,
  },
  checkout: {
    pageMatchRegexp: /my-checkout/,
    thankYouPageMatchRegexp: /(chkout\/(rc\?|rcsignedin\?))/,
    summaryContainer: '#order-summary-wrapper',
    subtotalPriceSelector: `#cx-at-SUM_SUB_TOTAL-value, #rc-order-subtotal`,
    totalPriceSelector: `#cx-at-GRAND_TOTAL-value, #rc-order-grandtotal`,
  },
};

export class Macys extends BaseWebsite {
  protected config = config;

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    try {
      const websiteData = document.querySelector('script[type="application/ld+json"]')?.textContent as string;
      const gtin = JSON.parse(websiteData)?.offers[0].SKU;

      return gtin?.substring(0, 12);
    } catch (e) {
      return null;
    }
  }
}
