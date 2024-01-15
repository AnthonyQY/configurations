import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Localhost',
  category: 'bestbuy',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\d/,
    nameSelector: '',
    imageSelector: '',
    priceSelector: '',
  },
  coupons: {
    applyStyles: false,
    activationStyles: ``,
    inputSelector: '',
    submitSelector: '',
    submission: {
      waitForElementSelector: '',
    },
  },
  cart: {
    pageMatchRegexp: /\d/,
    couponCodeSelector: '',
    summaryContainer: '',
    subtotalPriceSelector: ``,
    totalPriceSelector: ``,
  },
  checkout: {
    pageMatchRegexp: /\d/,
    thankYouPageMatchRegexp: /\d/,
    couponCodeSelector: '',
    summaryContainer: '',
    subtotalPriceSelector: ``,
    totalPriceSelector: ``,
  },
};

export class Localhost extends BaseWebsite {
  price = 19;

  protected config = config;

  parseGTIN() {
    return null;
  }

  waitForElement(): any {
    return () => Promise.resolve();
  }

  isCheckoutPage() {
    return false;
  }

  getUrl(): string {
    return 'https://bestbuy.com';
  }

  getProduct() {
    return Promise.resolve({
      name: 'Test Product',
      image: '',
      price: this.price,
    });
  }

  observeOrderSummary() {
    return Promise.resolve();
  }

  getTotalPrice() {
    return Promise.resolve(this.price);
  }

  handlePriceChange(): any {
    return Promise.resolve();
  }

  getDatafinityQuery() {
    return null;
  }

  checkCouponValidity() {
    return Promise.resolve(true);
  }
}
