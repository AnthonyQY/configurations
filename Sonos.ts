import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';
import type { Coupon } from '~types/coupon';

const config: WebsiteConfig = {
  name: 'Sonos',
  category: 'sonos',
  priceReplacementRegex: /-?[^\d.-]/g,
  hasCashBack: false,
  product: {
    pageMatchRegexp: /shop\//,
    nameSelector: '#main h1',
    imageSelector: '#main div[data-testid="product-image"] img',
    priceSelector: '#main div[data-testid="sale-price"], #main div[data-testid="main-price"]',
  },
  coupons: {
    applyStyles: false,
    activationStyles: ``,
    inputSelector: '#couponCode',
    submitSelector: '.promo-code-btn',
    submission: {
      waitForElementSelector: '#checkout-spinner',
    },
  },
  cart: {
    pageMatchRegexp: /\/cart/,
    couponCodeSelector: '.container-fluid.totals.summary',
    subtotalPriceSelector: '.sub-total',
    summaryContainer: '.container-fluid.totals.summary',
    totalPriceSelector: '.grand-total',
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp: /(?:shop\/OrderReceipt.aspx|.*\/orderconfirmation)/,
    summaryContainer: '#summarySection.container-fluid.summary',
    subtotalPriceSelector: '.sub-total',
    totalPriceSelector: '.order-total-summary .grand-total-sum',
  },
};

export class Sonos extends BaseWebsite {
  protected config = config;
  private readonly eligibleEmailAddressMessage = 'requires an eligible email address';

  getDatafinityQuery(): string | null {
    const sku = this.parseSKU();

    if (!sku) {
      return null;
    }

    const gtin = `000${sku}`;

    return `gtins:${gtin.substring(gtin.length - 13)}`;
  }

  parseSKU() {
    return JSON.parse(document.querySelector('script[type="application/json"]#__NEXT_DATA__')?.textContent || '{}')
      .props?.pageProps?.product?.variants?.[0].product.data?.[0].gtin;
  }

  async detectAppliedCoupon(coupons: Coupon[]) {
    const { checkout, cart } = this.config;

    const coupon = await super.detectAppliedCoupon(coupons);
    const couponCodeSelector = this.isCartPage() ? cart.couponCodeSelector : checkout.couponCodeSelector;

    if (!couponCodeSelector) {
      return null;
    }

    const contentWithCoupons = this.getTextContent(couponCodeSelector).toLowerCase();

    if (coupon && contentWithCoupons.includes(this.eligibleEmailAddressMessage)) {
      return null;
    }

    return coupon;
  }
}
