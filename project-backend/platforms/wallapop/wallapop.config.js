export default {
  name: 'wallapop',
  displayName: 'Wallapop',
  baseUrl: 'https://es.wallapop.com',
  apiUrl: 'https://api.wallapop.com/api/v3/general/search',
  enabled: true,
  region: 'es',
  country: 'Spain',
  currency: 'EUR',
  rateLimit: { requests: 5, period: 1000 },
  timeout: 15000,
  requiresAuth: false,
  requiresCookies: false,
  // Wallapop regional URLs
  regionalUrls: {
    es: 'https://es.wallapop.com',
    it: 'https://it.wallapop.com',
    pt: 'https://pt.wallapop.com',
    uk: 'https://uk.wallapop.com',
  },
};
