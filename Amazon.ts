import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Amazon',
  category: 'amazon',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/dp\/\w+/,
    nameSelector: '#productTitle',
    imageSelector: '#unrolledImgNo0 img, #imgTagWrapperId img, .imgTagWrapper img',
    priceSelector: `
      .priceToPay > .a-offscreen,
      .apexPriceToPay .a-offscreen,
      .priceToPay .a-price-fraction,
      .priceToPay > span[aria-hidden="true"]
    `,
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      .section-overwrap,
      #gc-error,
      .a-alert-inline {
        display: none !important;
      }

      #spc-gcpromoinput,
      .a-input-text,
      .a-alert-content {
         color: white !important;
         border: 1px solid #888C8C !important;
         box-shadow: 0 1px 2px rgba(15,17,17,.15) inset !important;
      }
    `,
    inputSelector: 'input[placeholder="Enter Code"], input[placeholder="Enter code"]',
    submitSelector: 'input[type="submit"]',
    submission: {
      waitForElementSelector: '.section-overwrap',
    },
  },
  cart: {
    pageMatchRegexp: /^\/cart|^\/gp\/cart/,
    summaryContainer: '#sc-buy-box',
    subtotalPriceSelector: `
      #sc-subtotal-amount-buybox .sc-price
    `,
  },
  checkout: {
    pageMatchRegexp: /\/buy\/\w+\/handlers/,
    thankYouPageMatchRegexp: /gp\/buy\/thankyou.+(?:order|purchase)Id=(\d.+)/,
    couponCodeSelector: '#subtotals div[aria-label="Order summary and subtotal"]',
    summaryContainer: '#subtotalsSection',
    subtotalPriceSelector: `
      tbody > tr:first-child.order-summary-unidenfitied-style .a-text-right.a-align-bottom.aok-nowrap,
      #subtotals-marketplace-table tbody > tr:first-child.small-line-height .a-text-right.aok-nowrap.a-nowrap
    `,
    totalPriceSelector: `
      .order-summary-grand-total + tr[data-testid] .a-text-right
    `,
  },
};

export class Amazon extends BaseWebsite {
  protected config = config;

  getDatafinityQuery(): string | null {
    const asin = this.parseAsin();

    return asin ? `asins:${asin}` : null;
  }

  private parseAsin() {
    const regex = /\/(?:dp|product)\/(\w{10})/;
    const match = regex.exec(window.location.href);

    return match ? match[1] : null;
  }
}
