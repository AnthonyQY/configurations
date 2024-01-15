import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Sam’s Club',
  category: 'samsclub',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/p\//,
    nameSelector: '.sc-pc-title-full-desktop h1',
    imageSelector: '.sc-image-viewer-img.sc-viewer-zoom-img',
    priceSelector: '.sc-price .visuallyhidden',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      #text-input {
        border-color: #728997;
        background-color: #fff;
        color: #fff;
      }
      
      .bst-form-helper.with-error {
        display: none;
      }
    `,
    inputSelector: '#text-input',
    submitSelector: '.sc-cart-coupon-input-form button',
    submission: {
      waitForElementSelector: '.sc-loader',
    },
  },
  cart: {
    pageMatchRegexp: /\/cart/i,
    couponCodeSelector: '.sc-cart-order-summary',
    summaryContainer: '.sc-cart-order-summary',
    subtotalPriceSelector: `.sc-cart-order-summary-price`,
    totalPriceSelector: `.sc-cart-order-summary-price.sc-cart-estimated-total-price`,
  },
  checkout: {
    pageMatchRegexp: /\/checkout/i,
    thankYouPageMatchRegexp: /thank-you/i,
    couponCodeSelector: '.sc-cart-order-summary',
    summaryContainer: '.sc-cart-order-summary',
    subtotalPriceSelector: `.sc-cart-order-summary-price`,
    totalPriceSelector: `.sc-cart-order-summary-price.sc-cart-estimated-total-price`,
  },
};

export class Samsclub extends BaseWebsite {
  protected config = config;

  beforeApplyCoupons() {
    const button = document.querySelector('.sc-cart-coupon .sc-dashed-box button') as HTMLButtonElement;

    if (button) {
      button.click();
    }
  }

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    const scriptElement = document.querySelector('script[id="tb-djs-wml-redux-state"][type="application/json"]');

    if (scriptElement) {
      const products = JSON.parse(scriptElement?.textContent as string).cache.products;
      const productId = Object.keys(products)[0];

      const upc = products[productId].skus[0].onlineOffer.generatedUPC;
      return upc.substring(upc.length - 12);
    }

    return null;
  }
}
