import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Home Depot',
  category: 'homedepot',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/p\//,
    nameSelector: '.product-details__badge-title--wrapper h1',
    imageSelector: '.mediagallery__mainimageblock.mediagallery__mainimageblock--size img',
    priceSelector: '.price-format__large.price-format__main-price',
  },
  coupons: {
    applyStyles: false,
    activationStyles: ``,
    inputSelector: '.promo-code__input, #promoId',
    submitSelector: '#applyPromoButton, .recaptcha--component button',
    submission: {
      waitForElementSelector: '.full-page--loader',
    },
  },
  cart: {
    pageMatchRegexp: /mycart/,
    couponCodeSelector: 'article.grid.isBound .toggleCertona .summary-totals-pod div:nth-child(2)',
    summaryContainer: 'article.grid.isBound .toggleCertona .summary-totals-pod',
    subtotalPriceSelector: `[data-automation-id="totalsSubTotalAmount"]`,
    totalPriceSelector: `[data-automation-id="totalsTotalPriceAmount"]`,
  },
  checkout: {
    pageMatchRegexp: /mycheckout\/checkout/,
    thankYouPageMatchRegexp: /order-confirmation/,
    couponCodeSelector: 'article.grid.isBound .toggleCertona .summary-totals-pod div:nth-child(2)',
    summaryContainer: 'article.grid.isBound .toggleCertona .summary-totals-pod',
    subtotalPriceSelector: `[data-automation-id="subTotalCost"]`,
    totalPriceSelector: `[data-automation-id="totalsTotalPriceAmount"]`,
  },
};
export class Homedepot extends BaseWebsite {
  protected config = config;

  public async parseCheckoutPrice(): Promise<{ subtotalPrice: number; totalPrice: number }> {
    const { subtotalPriceSelector, totalPriceSelector } = this.config.checkout;
    await this.waitForElement(subtotalPriceSelector);
    await this.waitForElement(totalPriceSelector);

    return {
      subtotalPrice: this.getPriceFromElement(subtotalPriceSelector),
      totalPrice: this.getPriceFromElement(totalPriceSelector) / 100,
    };
  }

  public async parseCartPrice(): Promise<{ subtotalPrice: number; totalPrice: number }> {
    const { totalPriceSelector } = this.config.cart;

    if (totalPriceSelector) {
      await this.waitForElement(totalPriceSelector);
    }

    return {
      subtotalPrice: 0,
      totalPrice: totalPriceSelector ? this.getPriceFromElement(totalPriceSelector) / 100 : 0,
    };
  }

  async beforeApplyCoupons() {
    const button = document.querySelector('.promo-code-link, span[data-automation-id="promoCodeLink"]') as HTMLElement;

    if (button) {
      button.click();
    }

    const recaptchaSelector = 'iframe[title="reCAPTCHA"]';

    await this.waitForElement(recaptchaSelector);

    // TODO: Find a way of how to update the store
    // const iframe = document.querySelector(recaptchaSelector);
    //
    // if (iframe) {
    //   const { dispatch } = this.store;
    //   dispatch({
    //     type: 'savings/setCouponCaptchaRequired',
    //     payload: true,
    //   });
    //   return;
    // }
  }

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      const product = JSON.parse(jsonLd.innerHTML);
      const gtin13 = product.gtin13;
      return gtin13;
    }
    return null;
  }
}
