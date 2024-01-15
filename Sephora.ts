import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Sephora',
  category: 'sephora',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/product\//,
    nameSelector: 'span[data-at="product_name"]',
    imageSelector: '[data-comp*="Carousel"] ul li:not([aria-hidden="true"]) picture img',
    priceSelector: 'p[data-comp*="Price"]  > span > span > b',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      p[data-comp="InputMsg StyledComponent BaseComponent "],
      div[data-comp="TextInput "] div div label,
      div[data-comp="TextInput "] div span {
        display: none !important;
      }
      
      div[data-comp="TextInput "] div div input {
        color: #fff !important;
      }
      
      div[data-comp="TextInput "] div {
        border-color: #000 !important;
      }
    `,
    inputSelector: '#promoInput',
    submitSelector: 'button.css-19et8pw',
    submission: {
      waitForElementSelector: '.css-7cdjnf',
    },
  },
  cart: {
    pageMatchRegexp: /basket/,
    hasCoupons: true,
    couponCodeSelector: '#promoInput',
    summaryContainer: 'body > div:nth-child(3) > div > main > div > div > div.eanm77i0 > div:nth-child(1)',
    subtotalPriceSelector: `[data-at="bsk_total_merch"]`,
    totalPriceSelector: `[data-at="bsk_total_cc"]`,
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp: /checkout\/confirmation\?orderId=(?:\d+)/,
    couponCodeSelector: '#promoInput',
    summaryContainer:
      'body > div:nth-child(3) > div > main > div > div > div.eanm77i0 > div:nth-child(1), div[data-at="order_summary"]',
    subtotalPriceSelector: `div[data-at="total_merch"]`,
    totalPriceSelector: `[data-at="bsk_total_cc"]`,
  },
};
export class Sephora extends BaseWebsite {
  protected config = config;

  beforeApplyCoupons() {
    const button = document.querySelector('button.css-lhobn1') as HTMLButtonElement;
    if (button) {
      button.click();
    }
  }

  getDatafinityQuery() {
    const sku = this.parseSku();

    return sku ? `skus.value:${sku}` : null;
  }

  private parseSku() {
    const element = document.querySelector('p[data-at="item_sku"]');

    if (element) {
      return element.textContent?.replace('Item ', '') as string;
    }

    return null;
  }
}
