import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Microsoft',
  category: 'microsoft',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/d\//,
    nameSelector: 'h1[data-automation-test-id="buy-box-product-title"]',
    imageSelector: 'img[data-automation-test-id="buy-box-product-image"]',
    priceSelector: 'span[data-automation-test-id="buy-box-price"]',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      .section-overwrap,
      p[class*="error"] {
        display: none !important;
      }
      
      input[aria-label="Enter code"] {
        color: #fff !important;
      }
    `,
    inputSelector: 'input[aria-label="Enter code"]',
    submitSelector: 'button[class*="applyButton"]',
    submission: {
      waitForElementSelector: 'div[aria-label="Loading"]',
    },
  },
  cart: {
    pageMatchRegexp: /\/store\/cart/,
    summaryContainer: 'div[class*="greyBox"]',
    totalPriceSelector: `[aria-live="polite"] .c-paragraph-4 span:last-child`,
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp: /thank-you/, // TODO: Not sure if this is correct
    couponCodeSelector: 'div[class*="greyBox"]',
    summaryContainer: 'div[class*="greyBox"]',
    subtotalPriceSelector: `span[itemprop="price"] span`,
    totalPriceSelector: `[aria-live="polite"] .c-paragraph-4 span:last-child`,
  },
};

export class Microsoft extends BaseWebsite {
  protected config = config;

  beforeApplyCoupons() {
    const btn = document.querySelector('[class*="addButton"]') as HTMLButtonElement;

    if (btn) {
      btn.click();
    }
  }

  getDatafinityQuery() {
    const sku = this.parseSku();

    return sku ? `skus.value:${sku}` : null;
  }

  parseSku() {
    try {
      const data = JSON.parse(
        (document.querySelector('.buybox-locale-value')?.nextElementSibling?.textContent || '').replace(
          'window.__BuyBox__=',
          '',
        ),
      );

      return `${data.product.productId}-${data.product.skuOrder[0]}`.toUpperCase();
    } catch (error) {
      return null;
    }
  }
}
