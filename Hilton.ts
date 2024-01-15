import { BaseWebsite } from '~services/website/providers/BaseWebsite';
import type { WebsiteConfig } from '~services/website/types';

const config: WebsiteConfig = {
  name: 'Hilton',
  category: 'hilton',
  priceReplacementRegex: /[^\d.-]/g,
  hasCashBack: false,
  product: {
    pageMatchRegexp: /\/dp\/\w+\//,
    nameSelector: '',
    imageSelector: '',
    priceSelector: '',
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
    pageMatchRegexp: /book\/reservation\/payment/,
    couponCodeSelector: '',
    summaryContainer: '',
    subtotalPriceSelector: `[data-testid="totalForStay"] + button + [class*="PriceSummary_priceLine__"] span:nth-of-type(2)`,
    totalPriceSelector: `[data-testid="totalForStayAmount"]`,
  },
  checkout: {
    pageMatchRegexp: /book\/reservation\/payment/,
    thankYouPageMatchRegexp: /confirmation/,
    couponCodeSelector: '',
    summaryContainer: '',
    subtotalPriceSelector: `[data-testid="totalForStay"] + button + [class*="PriceSummary_priceLine__"] span:nth-of-type(2)`,
    totalPriceSelector: `[data-testid="totalForStayAmount"]`,
  },
};

export class Hilton extends BaseWebsite {
  protected config = config;

  getDatafinityQuery() {
    return null;
  }

  parseGTIN() {
    return null;
  }
}
