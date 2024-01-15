import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Target',
  category: 'target',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/p/,
    nameSelector: '#pdp-product-title-id',
    imageSelector: 'button[data-test="image-gallery-item-0"] img',
    priceSelector: 'span[data-test="product-price"]',
  },
  coupons: {
    applyStyles: true,
    activationStyles: ``,
    inputSelector: '#promoCodeEntry',
    submitSelector: 'button[data-test="apply-promo-code-button"]',
    submission: {
      waitForElementSelector: '#cartLoading',
    },
  },
  cart: {
    pageMatchRegexp: /cart/,
    couponCodeSelector: '#orderSummaryWrapperDiv div',
    summaryContainer: '#orderSummaryWrapperDiv div',
    subtotalPriceSelector: `[data-test="cart-summary-subTotal"] > div:last-child .h-text-bs`,
    totalPriceSelector: `div[data-test="cart-summary-total"] p`,
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp: /(?:co-thankyou|order-confirmation)\?orderId=([\w\d-]+)/,
    summaryContainer: '#orderSummaryWrapperDiv div',
    subtotalPriceSelector: `[data-test="cart-summary-subTotal"] > div:last-child .h-text-bs`,
    totalPriceSelector: `div[data-test="cart-summary-total"] p`,
  },
};

export class Target extends BaseWebsite {
  protected config = config;

  async beforeApplyCoupons() {
    const button = document.querySelector('#add-promo-code-btn') as HTMLButtonElement;

    if (button) {
      button.click();
    }

    await this.waitForElement('#promoCodeEntry');
    await this.waitForElement('label[for="promoCodeEntry"]');

    const input = document.querySelector('#promoCodeEntry') as HTMLInputElement;

    input.style.color = '#fff';
    input.style.borderColor = '#888';
    input.style.background = '#fff';

    const label = document.querySelector('label[for="promoCodeEntry"]') as HTMLLabelElement;

    if (label) {
      label.style.display = 'none';
    }

    const loader = document.querySelector('#cartLoading') as HTMLElement;
    if (loader) {
      loader.style.zIndex = '-1';
    }

    await this.waitForElement('#promoCodeEntry--ErrorMessage');

    const error = document.querySelector<HTMLSpanElement>('#promoCodeEntry--ErrorMessage');

    if (error) {
      error.style.display = 'none';
    }

    if (input) {
      input.value = '';
      input.style.borderColor = '#888';
      input.style.background = '#fff';
      input.style.color = '#fff';
    }
  }

  removeStyles() {
    super.removeStyles();
    const close = document.querySelector<HTMLButtonElement>('button[aria-label="close"]');

    if (close) {
      close.click();
    }
  }

  getDatafinityQuery() {
    const upca = this.parseUPCA();

    if (!upca) {
      return null;
    }

    const gtin = `000${upca}`;

    return `gtins:${gtin.substring(gtin.length - 13)}`;
  }

  private parseUPCA() {
    const upcPattern = /UPC/;
    const elements = document.querySelectorAll('div[data-test="item-details-specifications"] div');
    let gtin = null;

    elements.forEach((element) => {
      const text = element?.textContent?.trim() || '';
      const match = text.match(upcPattern);

      if (match) {
        gtin = match.input?.replace('UPC:', '').trim();
      }
    });

    return gtin;
  }
}
