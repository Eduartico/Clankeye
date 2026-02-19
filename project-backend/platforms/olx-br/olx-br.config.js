export default {
  name: 'olx-br',
  displayName: 'OLX Brasil',
  baseUrl: 'https://www.olx.com.br',
  apiUrl: 'https://www.olx.com.br/api/v1/offers/',
  enabled: true,
  region: 'br',
  country: 'Brazil',
  currency: 'BRL',
  rateLimit: { requests: 10, period: 1000 },
  timeout: 15000,
  requiresAuth: false,
  requiresCookies: false,
};
