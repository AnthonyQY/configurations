import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';
import type { Coupon } from '~types/coupon';

const config: WebsiteConfig = {
  name: 'Kohls',
  category: 'kohls',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /product/,
    nameSelector: '.product-title',
    imageSelector: '.pdp-image-main-img, .pdp-large-hero-image img',
    priceSelector: '.pdpprice-row2 span',
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
    inputSelector: '.promo-code-panel input',
    submitSelector: '.apply-btn-container .kds-button',
    submission: {
      waitForElementSelector: '.ajax-loading1_loader',
    },
  },
  cart: {
    pageMatchRegexp: /^\/checkout\/shopping_cart\.jsp/,
    couponCodeSelector: '.offer-panel-applied',
    summaryContainer: '.cart-block',
    totalPriceSelector: `.order-summary-total-hr + .cart-block-item .cart-block-item-value`,
    subtotalPriceSelector: `.cart-block-item .cart-block-item-value`,
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp: /checkout\/v2\/order_confirm\.jsp/,
    couponCodeSelector: '.offer-panel-applied',
    summaryContainer: '.cart-block',
    subtotalPriceSelector: `.cart-block-item .cart-block-item-value`,
    totalPriceSelector: `.order-summary-total-hr + .cart-block-item .cart-block-item-value`,
  },
};

export class Kohls extends BaseWebsite {
  protected config = config;

  async beforeApplyCoupons() {
    const input = document.querySelector('.promo-code-panel input');

    if (!input) {
      const button = document.querySelector('.open-offers-btn') as HTMLButtonElement;

      if (button) {
        button.click();
      }
    }
  }

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    const scripts = document.querySelectorAll('.at-element-marker [type="text/javascript"]');

    if (scripts.length) {
      const ids = [...scripts].reduce((acc: number[], script) => {
        script.innerHTML.split('UPC').forEach((str) => {
          const id = parseInt(str.split('ID":"')[1]);
          if (!isNaN(id)) {
            acc.push(id);
          }
        });

        return acc;
      }, []);

      const padStart = (num: number) => {
        let str = num.toString();
        while (str.length < 12) {
          str = '0' + str;
        }

        return str;
      };

      return padStart(ids[0]);
    }

    return null;
  }

  async detectAppliedCoupon(coupons: Coupon[]) {
    let couponsRegex: RegExp | null = null;
    const { checkout, cart } = this.config;

    const couponCodeSelector = this.isCartPage() ? cart.couponCodeSelector : checkout.couponCodeSelector;

    if (!couponCodeSelector) {
      return null;
    }

    const attributeWithCoupon = document
      .querySelector(couponCodeSelector)
      ?.getAttribute('data-name')
      ?.toLowerCase() as string;

    if (coupons?.length) {
      couponsRegex = new RegExp((coupons || []).map((coupon: Coupon) => coupon.code.toLowerCase()).join('|'));
    }

    if (couponsRegex) {
      if (couponsRegex.test(attributeWithCoupon)) {
        return coupons?.find((coupon: Coupon) => new RegExp(coupon.code.toLowerCase()).test(attributeWithCoupon));
      }
    }

    return null;
  }
}
