import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Ebay',
  category: 'ebay',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/itm\//,
    nameSelector: '.x-item-title__mainTitle span',
    imageSelector: '.ux-image-magnify__container img',
    priceSelector: '.x-price-primary span',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      #redemptionCode-error {
        display: none !important;s
      }
      #spc-gcpromoinput,
      .a-input-text,
      .a-alert-content {
         color: white !important;
         border: 1px solid #888C8C !important;
         box-shadow: 0 1px 2px rgba(15,17,17,.15) inset !important;
      }
    `,
    inputSelector: 'input[name="redemptionCode"]',
    submitSelector: 'button[data-test-id="INCENTIVES_ADD_BUTTON"]',
    submission: {
      waitForElementSelector: '.incentives--input-form-content',
    },
  },
  cart: {
    pageMatchRegexp: /^\/my-bag/,
    summaryContainer: '[data-test-id="cart-summary"]',
    subtotalPriceSelector: '[data-test-id="SUBTOTAL"]',
  },
  checkout: {
    pageMatchRegexp: /rxo|rgxo|cart/,
    thankYouPageMatchRegexp: /rxo\?action=success&sessionid=(\d+)/,
    couponCodeSelector: 'ul.incentives--list',
    summaryContainer: '.sticky',
    subtotalPriceSelector: `tr[data-test-id="SUB_TOTAL"] .amount span`,
    totalPriceSelector: `tr[data-test-id="TOTAL"] .amount span`,
  },
};
export class Ebay extends BaseWebsite {
  protected config = config;

  isCheckoutPage() {
    const {
      checkout: { pageMatchRegexp },
    } = this.config;

    if (pageMatchRegexp) {
      return pageMatchRegexp.test(window.location.host + window.location.pathname + window.location.search);
    }

    return false;
  }

  isCartPage(): boolean {
    return window.location.host === 'cart.ebay.com';
  }

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    try {
      const websiteData = document.querySelectorAll('script[type="application/ld+json"]')[1]?.textContent as string;
      const gtin = JSON.parse(websiteData)?.gtin13;

      return gtin;
    } catch (e) {
      return null;
    }
  }

  couponCodeSelectorIsDisabled() {
    const disabled = document.querySelector('.module.disabled.incentives');
    return !!disabled;
  }
}
