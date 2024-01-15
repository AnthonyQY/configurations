import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Best Buy',
  category: 'bestbuy',
  priceReplacementRegex: /[^\d.-]/g,
  hasCashBack: false,
  product: {
    pageMatchRegexp: /\.p\?skuId=\d+/,
    nameSelector: '.heading-5.v-fw-regular',
    imageSelector: '.media-gallery-base-content.thumbnails .seo-list li:first-child img',
    priceSelector: '.priceView-hero-price.priceView-customer-price > span',
  },
  coupons: {
    applyStyles: false,
    activationStyles: ``,
    inputSelector: '#gcNumber',
    submitSelector: 'button[data-track="promo-code-apply"]',
    submission: {
      waitForElementSelector: '.spinner.spinner-large',
    },
  },
  cart: {
    pageMatchRegexp: /^\/cart$/,
    summaryContainer: '.order-summary',
    totalPriceSelector: `
      .below-the-line-item > div:last-child
    `,
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp: /\/checkout\/.*\/thank-you/,
    couponCodeSelector: '.order-summary.order-summary--inactive',
    summaryContainer: '.order-summary.order-summary--inactive',
    subtotalPriceSelector: '.order-summary-card__total-line .order-summary__price',
    totalPriceSelector: '.order-summary__total .cash-money',
  },
};

export class BestBuy extends BaseWebsite {
  protected config = config;

  beforeApplyCoupons() {
    const button = document.querySelector('button[data-track="gift-promo-code-link"]') as HTMLButtonElement;

    if (button) {
      button.click();
    }
  }

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  private parseGTIN() {
    try {
      return JSON.parse(
        document.querySelector('div[data-reactroot] script[type="application/ld+json"]')?.textContent as string,
      )?.gtin13;
    } catch (e) {
      return null;
    }
  }
}
