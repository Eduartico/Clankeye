export default {
  name: 'leboncoin',
  displayName: 'Leboncoin',
  baseUrl: 'https://www.leboncoin.fr',
  apiUrl: 'https://api.leboncoin.fr/finder/search',
  enabled: true,
  region: 'fr',
  country: 'France',
  currency: 'EUR',
  rateLimit: { requests: 3, period: 1000 },
  timeout: 15000,
  requiresAuth: false,
  requiresCookies: true,
};
