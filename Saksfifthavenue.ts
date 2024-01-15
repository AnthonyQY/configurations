import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';
import type { AppGetState } from '~store';
import type { Coupon } from '~types/coupon';

const config: WebsiteConfig = {
  name: 'Saks Fifth Avenue',
  category: 'saksfifthavenue',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/product\//,
    nameSelector: '.product-name',
    imageSelector: '.img-fluid.primary-image-img',
    priceSelector: '.formatted_sale_price',
  },
  coupons: {
    applyStyles: false,
    activationStyles: '',
    inputSelector: '#couponCode',
    submitSelector: '.promo-code-btn',
    submission: {
      waitForElementSelector: '.spinner',
    },
  },
  cart: {
    pageMatchRegexp: /\/cart/,
    couponCodeSelector: '.coupons-and-promos',
    summaryContainer: '.order-summary-details, .order-mini-summary',
    subtotalPriceSelector: `.subtotal .info-value span, .sub-total.bfx-price.bfx-total-subtotal`,
    totalPriceSelector: `.estm-ttl .grand-total-value`,
  },
  checkout: {
    pageMatchRegexp: /\/checkout/,
    thankYouPageMatchRegexp: /(checkout|orderconfirm)(\/thank-you|\?ID=).*/,
    couponCodeSelector: '.coupons-and-promos',
    summaryContainer: '.order-summary-details, .order-mini-summary',
    subtotalPriceSelector: `.subtotal .info-value span, .sub-total.bfx-price.bfx-total-subtotal, .sub-total`,
    totalPriceSelector: `.grand-total-value, .grand-total-sum`,
  },
};
export class Saksfifthavenue extends BaseWebsite {
  protected config = config;

  getDatafinityQuery() {
    const gtin = this.parseGTIN();

    return gtin ? `gtins:${gtin}` : null;
  }

  parseGTIN() {
    const scriptElement = document.querySelector('script[type="application/ld+json"]');
    if (scriptElement) {
      const json = JSON.parse(scriptElement.innerHTML);
      const gtin13 = json.gtin13;
      return gtin13 === '' ? null : gtin13;
    }
    return null;
  }

  async applyCoupons(coupons: Coupon[], { getState }: { getState: AppGetState }): Promise<void> {
    await super.applyCoupons(coupons, { getState });

    const input = document.querySelector('#couponCode') as HTMLInputElement;
    const icon = document.querySelector('.promo-code-entry .invalid') as HTMLElement;
    const couponError = document.querySelector('.promo-code-entry .coupon-error') as HTMLElement;

    const { appliedCoupon } = getState().savings;

    if (appliedCoupon && input && icon && couponError) {
      input.value = '';
      input.style.borderColor = '#aaa';
      icon.style.display = 'none';
      couponError.style.display = 'none';
    }
  }
}
