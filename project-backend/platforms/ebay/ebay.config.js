export default {
  name: 'ebay',
  displayName: 'eBay',
  baseUrl: 'https://www.ebay.com',
  apiUrl: 'https://api.ebay.com/buy/browse/v1/item_summary/search',
  enabled: true,
  region: 'us',
  country: 'United States',
  currency: 'USD',
  rateLimit: { requests: 5, period: 1000 },
  timeout: 15000,
  requiresAuth: true,
  requiresCookies: false,
  // eBay marketplace IDs
  marketplaces: {
    us: 'EBAY_US',
    uk: 'EBAY_GB',
    de: 'EBAY_DE',
    fr: 'EBAY_FR',
    it: 'EBAY_IT',
    es: 'EBAY_ES',
    au: 'EBAY_AU',
    ca: 'EBAY_CA',
  },
  // OAuth configuration
  oauth: {
    authUrl: 'https://api.ebay.com/identity/v1/oauth2/token',
    scopes: ['https://api.ebay.com/oauth/api_scope'],
  },
};
