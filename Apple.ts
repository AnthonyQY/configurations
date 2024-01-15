import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Apple',
  category: 'apple',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /shop\/(buy-[a-zA-Z]+(\/[a-zA-Z]+){1,2}|product\/[a-zA-Z]+)/,
    nameSelector: `
    .rf-bfe-container a,
    .as-standardnav-title a,
    .rf-pdp-title`,
    imageSelector: `
    .rf-bfe-gallery-image-wrapper img,
    .rf-configuration-sticky img,
    .rf-flagship-sticky img,
    .rf-accessory-inline-cardgallery-image img,
    .rf-pdp-inline-gallery-item-focusable img,
    .rc-productbundle img`,
    priceSelector: `
    .as-pricepoint-fullprice span,
    .rf-cto-summary-purchaseinfo .rc-price .rc-prices-currentprice.typography-label span,
    .price-point-fullPrice span,
    .price-point.price-point-fullPrice-short,
    .rf-pdp-prices .rc-prices-fullprice`,
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
    pageMatchRegexp: /\/shop\/bag/,
    summaryContainer: '#bag-container',
    totalPriceSelector: `
      .rs-summary-value[data-autom="bagtotalvalue"]
    `,
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp: /.*shop\/checkout\/thankyou/,
    couponCodeSelector: '',
    summaryContainer: '',
    subtotalPriceSelector: `
      .rs-summary-value[data-autom="bagrs-summary-subtotalvalue"]
    `,
    totalPriceSelector: `
      .rs-companionbar-button-amount
    `,
  },
};
export class Apple extends BaseWebsite {
  protected config = config;

  getDatafinityQuery(): string | null {
    const manufacturerNumber = this.parseManufacturerNumber();

    return manufacturerNumber ? `manufacturerNumber:${manufacturerNumber}` : null;
  }

  async parseCheckoutPrice(): Promise<{ subtotalPrice: number; totalPrice: number }> {
    try {
      const script = document.getElementById('init_data') as HTMLScriptElement;
      const websiteData = JSON.parse(script?.textContent as string);
      const orderSummary = websiteData?.checkout?.companionBar?.orderSummary || websiteData?.shoppingCart?.summary;
      const summary: any = Object.values(orderSummary).find((value: any) => value.total);

      if (summary) {
        return {
          subtotalPrice: this.getNumericPrice(summary.subtotal),
          totalPrice: this.getNumericPrice(summary.total),
        };
      }
    } catch (e) {
      // do nothing
    }

    return super.parseCheckoutPrice();
  }

  parseManufacturerNumber() {
    try {
      const websiteData = document.querySelector('script[type="application/ld+json"]')?.textContent as string;
      return JSON.parse(websiteData)?.offers[0].sku.replace('/', '');
    } catch (e) {
      return null;
    }
  }
}
