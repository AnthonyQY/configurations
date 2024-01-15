import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Walmart',
  category: 'walmart',
  priceReplacementRegex: /[^\d.-]/g,
  hasCashBack: false,
  product: {
    pageMatchRegexp: /\/ip\/\w+/i,
    nameSelector: 'h1.lh-copy[itemprop="name"]',
    imageSelector: 'div[data-testid="media-thumbnail"] img',
    priceSelector: 'span[data-testid="price-wrap"] span[itemprop="price"]',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
#totalSummary .flex.flex-column.w-100.absolute--fill.z-max {
  display: none;
}
    `,
    inputSelector: 'input[id*="react-aria"]',
    submitSelector: '[aria-describedby="delivery-instructions"] .pt4 button[type="button"]',
    submission: {
      waitForElementSelector: '.w-100.fixed.z-max.absolute--fill svg',
    },
  },
  cart: {
    pageMatchRegexp: /^\/cart/,
    summaryContainer: '#totalSummary',
    subtotalPriceSelector: `[data-testid="subtotal-label-pos"] + .flex .mid-gray.f5`,
    totalPriceSelector: `label[for="grandTotal-label"]+ div`,
  },
  checkout: {
    pageMatchRegexp: /checkout\/review-order/i,
    thankYouPageMatchRegexp: /(?:checkout\/thankyou(?!\/photo(?!\?version=v\d))|thankyou|ip)/i,
    couponCodeSelector: '#totalSummary',
    summaryContainer: '#totalSummary',
    subtotalPriceSelector: `[data-testid="subtotal-label-pos"] + .flex .mid-gray.f5`,
    totalPriceSelector: `label[for="grandTotal-label"]+ div`,
  },
};

export class Walmart extends BaseWebsite {
  protected config = config;

  getDatafinityQuery(): string | null {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  private parseGTIN() {
    try {
      const websiteData = document.querySelector('script[type="application/ld+json"]')?.textContent as string;
      const gtin = '000' + JSON.parse(websiteData)?.gtin13;

      return gtin.substring(gtin.length - 13);
    } catch (e) {
      return null;
    }
  }
}
