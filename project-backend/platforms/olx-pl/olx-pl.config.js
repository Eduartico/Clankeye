export default {
  name: 'olx-pl',
  displayName: 'OLX Poland',
  baseUrl: 'https://www.olx.pl',
  apiUrl: 'https://www.olx.pl/api/v1/offers/',
  enabled: true,
  region: 'pl',
  country: 'Poland',
  currency: 'PLN',
  rateLimit: { requests: 10, period: 1000 },
  timeout: 15000,
  requiresAuth: false,
  requiresCookies: false,
};
