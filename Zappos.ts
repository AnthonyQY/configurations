import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Zappos',
  category: 'zappos',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/p\//,
    nameSelector: 'span[itemprop="brand"] + span',
    imageSelector: 'img[itemprop="image"]',
    priceSelector: 'span[itemprop="price"]',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
    #code {
      border-color: #ddd;
      color: #fff;
    }
    
    #main > div > div > div > div:nth-child(2) > div > div:nth-child(2) div div p {
      display: none;
    }
    `,
    inputSelector: '#code',
    submitSelector: '#main > div > div > div > div:nth-child(2) > div > div:nth-child(2) form button',
    submission: {
      waitForElementSelector: '#main > div > div > div > div:nth-child(2) > div > div:nth-child(2) form button',
    },
  },
  cart: {
    pageMatchRegexp: /cart/,
    summaryContainer: '#main > div > div > div > div:nth-child(2) > div > div',
    subtotalPriceSelector: `#main > div > div > div:nth-child(4) > div:nth-child(2) > div > div > dl > dd`,
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp: /confirmation/,
    couponCodeSelector: '#main > div > div > div > div:nth-child(2) > div > div > div:nth-child(3)',
    summaryContainer: '#main > div > div > div > div:nth-child(2) > div > div',
    subtotalPriceSelector: `#main > div > div > div > div:nth-child(2) > div > div > div:nth-child(3) > div:nth-child(3)`,
    totalPriceSelector: `#main > div > div > div > div:nth-child(2) > div > div > div:nth-child(3) > div:last-child`,
  },
};

export class Zappos extends BaseWebsite {
  protected config = config;

  beforeApplyCoupons() {
    const button = document.querySelector(
      '#main > div > div > div > div:nth-child(2) > div > div:nth-child(2) button',
    ) as HTMLButtonElement;

    if (button) {
      button.click();
    }
  }

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    const scriptElement = document.querySelector('body script:nth-child(5)');

    if (scriptElement) {
      const scriptContent = scriptElement.innerHTML.split('window.__INITIAL_STATE__ = ');
      const regex = /"upc"\s*:\s*"([^"]*)"/;

      const match = scriptContent[1].match(regex);
      if (match) {
        return match[1];
      }
    }
    return null;
  }
}
