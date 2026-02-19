export default {
  name: 'olx-pt',
  displayName: 'OLX Portugal',
  baseUrl: 'https://www.olx.pt',
  apiUrl: 'https://www.olx.pt/api/v1/offers/',
  enabled: true,
  region: 'pt',
  country: 'Portugal',
  currency: 'EUR',
  rateLimit: { requests: 10, period: 1000 },
  timeout: 15000,
  requiresAuth: false,
  requiresCookies: false,
};
