import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Samsung',
  category: 'samsung',
  priceReplacementRegex: /[^\d.-]/g,
  product: {
    pageMatchRegexp: /\d/,
    nameSelector:
      '.oos-title2, .product-top-nav__font-name, h1.product-details__info-title, .bundle-details-right__title, [class*="Header_productTitle"]',
    imageSelector:
      '.react-swipe-container.gallery-swipe div div img, .photo-img.active picture img, img[class*="Gallery_selectedImage"]',
    priceSelector:
      '.header-right-container.price-container .header-item.fullPriceText div div strong, .product-top-nav__font-price span.epp-price, .product-epp-discount__info .epp-price, .price-info strong, .total-price, [class*="Header_newdesc"] span:last-child',
  },
  coupons: {
    applyStyles: true,
    activationStyles: `
      .promo-form-holder .form-control {
        color: #fff !important;
      }
      
      .promo-applied.error {
        display: none;
      }
    `,
    inputSelector: '.promo-form-holder .form-control, .promo-form-holder input',
    submitSelector: '.promo-form-holder button, button[ecom-data-link_id="order_summary_apply_promo_code"]',
    submission: {
      waitForElementSelector: '.spinner_container .uil-spin-css',
    },
  },
  cart: {
    pageMatchRegexp: /cart/,
    couponCodeSelector: '.os-price-holder',
    summaryContainer: '.os-price-holder',
    subtotalPriceSelector: `.os-price-value`,
    totalPriceSelector: `.os-price-holder .os-price-row.total-row .os-price-value`,
  },
  checkout: {
    pageMatchRegexp: /checkout/,
    thankYouPageMatchRegexp:
      /(us\/checkout\/#\/order-confirm\/.|de\/web\/store\/order-confirm\?id=.).*|.*samsung\.com\/us\/web\/express\/order-confirm.*/,
    couponCodeSelector: '.os-price-holder',
    summaryContainer: '.os-price-holder',
    subtotalPriceSelector: `.os-price-value`,
    totalPriceSelector: `.os-price-holder .os-price-row.total-row .os-price-value`,
  },
};

export class Samsung extends BaseWebsite {
  protected config = config;

  beforeApplyCoupons() {
    const element = document.querySelector<HTMLLinkElement>(
      '.checkout-form-holder .checkout-promo-code .promo-holder a',
    );
    if (element) {
      element.click();
    }
  }

  getPriceFromElement(selector: string): number {
    const text = this.getTextContent(selector);

    return +text.split(' ')[0].replace(this.config.priceReplacementRegex, '');
  }

  isProductPage(): boolean {
    const {
      product: { nameSelector },
    } = this.config;

    if (nameSelector) {
      return !!document.querySelector(nameSelector);
    }

    return false;
  }

  getDatafinityQuery(): string | null {
    const manufacturerNumber = this.parseManufacturerNumber();

    return manufacturerNumber ? `manufacturerNumber:${manufacturerNumber}` : null;
  }

  parseManufacturerNumber() {
    if (document.querySelector('.oos-title2')) {
      return document.querySelector('.sku')?.textContent?.trim().split('/')[1].trimStart() as string;
    }

    if (document.querySelector('.product-top-nav__font-name')) {
      return this.getTextContent('strong.type-p3.product-details__info-sku').replace('/', '');
    }

    if (document.querySelector('[class*="Header_productTitle"]')) {
      return this.getTextContent(
        '[class*="ProductDetails_right"] [class*="Review_skuContainer"] strong:last-child',
      ).replace('/', '');
    }

    return null;
  }
}
