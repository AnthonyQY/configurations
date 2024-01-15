import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Lenovo',
  category: 'lenovo',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\/p\//,
    nameSelector: '.product_summary',
    imageSelector: '.swiper-slide.swiper-slide-active .image-pic img, .swiper-slide .image-pic img',
    priceSelector: '.final-price',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
    .eCouponEnter label {
      display: none;
    }
    
    .eCouponEnter input {
      color: #fff !important;
    }
    
    #topMsg {
      display: none;
    }
    `,
    inputSelector: '.eCouponEnter input',
    submitSelector: '.eCouponEnter button',
    submission: {
      waitForElementSelector: '.defaultButton.apply.success ',
    },
  },
  cart: {
    pageMatchRegexp: /\/cart/,
    couponCodeSelector: '#eCoupon',
    summaryContainer: '.summaryTotal',
    subtotalPriceSelector: `.subTotal`,
    totalPriceSelector: `.totalAmount`,
  },
  checkout: {
    pageMatchRegexp: /\/checkout/,
    thankYouPageMatchRegexp: /us\/en\/thankyou\.html.*/,
    couponCodeSelector: '#eCoupon',
    summaryContainer: '.summaryTotal',
    subtotalPriceSelector: `.subTotal`,
    totalPriceSelector: `.totalAmount`,
  },
};
export class Lenovo extends BaseWebsite {
  protected config = config;

  getDatafinityQuery(): string | null {
    const manufacturerNumber = this.parseManufacturerNumber();

    return manufacturerNumber ? `manufacturerNumber:${manufacturerNumber}` : null;
  }

  parseManufacturerNumber() {
    try {
      const websiteData = document.querySelectorAll('script[type="application/ld+json"]')[1].textContent as string;
      return JSON.parse(websiteData)?.sku;
    } catch (e) {
      return null;
    }
  }
}
