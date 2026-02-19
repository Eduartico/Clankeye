export default {
  name: 'todocoleccion',
  displayName: 'Todo Coleccion',
  baseUrl: 'https://www.todocoleccion.net',
  apiUrl: 'https://www.todocoleccion.net/busqueda/ajax-busqueda-multi',
  searchUrl: 'https://www.todocoleccion.net/s/',
  enabled: true,
  region: 'es',
  country: 'Spain',
  currency: 'EUR',
  rateLimit: { requests: 3, period: 1000 },
  timeout: 20000,
  requiresAuth: false,
  requiresCookies: true, // Needs session cookies for search
};
