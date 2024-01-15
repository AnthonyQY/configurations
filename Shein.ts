import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Shein',
  category: 'shein',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /p-(\d+)-cat-(\d+)/,
    nameSelector: '.product-intro__head-name',
    imageSelector: '.lcp-gallery__hook',
    priceSelector: '.from span',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      .c-input-coupon input {
        border-color: #000 !important;
        color: #fff !important;
        background-color: #fff !important;
      }
      
      #coupon-ada-tip,
      .sui-message.sui-message__type_error {
        display: none !important;
      }
    `,
    inputSelector: '.c-input-coupon input',
    submitSelector: '.check-coupon button',
    submission: {
      waitForElementSelector: '.check-coupon button div:first-child',
    },
  },
  cart: {
    pageMatchRegexp: /cart/,
    summaryContainer: '.c-check-cart-summary.fsp-element',
    subtotalPriceSelector: `.she-fr.total > span > span`,
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp: /pay\/result\/success\?billno=([\w]*)/,
    couponCodeSelector: '.summary-coupon-txt span',
    summaryContainer: '.order-summary-effiency',
    subtotalPriceSelector: `.summary-item .she-fr`,
    totalPriceSelector: `.she-fr.total span`,
  },
};
export class Shein extends BaseWebsite {
  protected config = config;

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    const element = document.querySelector('.product-intro__head-sku');
    const gtin = element?.textContent?.trim().split(':')[1]?.trim();
    if (gtin) {
      return gtin;
    }
    return null;
  }

  public async parseCartPrice(): Promise<{ subtotalPrice: number; totalPrice: number }> {
    const { subtotalPriceSelector } = this.config.cart;
    let subtotalPrice = '';

    // Helper function
    const getDigitFromStyle = (el: HTMLDivElement) => {
      const trasBox = el.querySelector('.tras-box') as HTMLDivElement;
      const top = trasBox.style?.top;

      return top ? Math.abs(+top.replace(/[^\d.-]/g, '')) / 20 : '';
    };

    if (subtotalPriceSelector) {
      document.querySelectorAll(subtotalPriceSelector).forEach((el: any) => {
        if (el.classList.contains('qw-num-box')) {
          subtotalPrice += getDigitFromStyle(el);
        } else {
          subtotalPrice += el.textContent.trim();
        }
      });
    }

    return {
      subtotalPrice: Number(subtotalPrice.replace(this.config.priceReplacementRegex, '')),
      totalPrice: 0,
    };
  }

  async parseCheckoutPrice() {
    if (this.isCartPage()) {
      return this.parseCartPrice();
    }

    const elements = document.querySelectorAll('.checkout-summary-price .summary-item');
    let subtotalPriceElement;
    let subtotalPriceText;

    for (const elem of elements) {
      if (elem.textContent?.toLowerCase()?.includes('subtotal')) {
        subtotalPriceElement = elem;
      }
    }

    if (subtotalPriceElement) {
      subtotalPriceText =
        subtotalPriceElement.parentElement?.querySelector('span:last-child > span')?.textContent?.trim() || '';
    }

    const { totalPriceSelector } = this.config.checkout;
    await this.waitForElement(totalPriceSelector);

    return {
      subtotalPrice: subtotalPriceText ? this.getNumericPrice(subtotalPriceText) : 0,
      totalPrice: totalPriceSelector ? this.getPriceFromElement(totalPriceSelector) : 0,
    };
  }
}
