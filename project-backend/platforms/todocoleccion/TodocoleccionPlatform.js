import BasePlatform from '../base/BasePlatform.js';
import { httpClient } from '../../utils/httpClient.js';
import config from './todocoleccion.config.js';
import { transformTodocoleccionResponse, parseHtmlResults } from './todocoleccion.transformer.js';

/**
 * Todo Coleccion platform implementation
 * Spanish collectibles marketplace
 */
class TodocoleccionPlatform extends BasePlatform {
  constructor() {
    super(config);
    this.cookies = null;
  }

  async search(query) {
    try {
      // Try API first, fallback to HTML scraping
      return await this.searchApi(query);
    } catch (error) {
      this.log(`API search failed, trying HTML scraping: ${error.message}`, 'warn');
      return await this.searchHtml(query);
    }
  }

  async searchApi(query) {
    if (!this.cookies) {
      this.cookies = await httpClient.fetchCookies(this.baseUrl);
    }

    const params = this.buildQueryParams(query);
    
    const data = await httpClient.getWithCookies(this.apiUrl, this.cookies, params, {
      timeout: this.timeout,
      headers: this.getHeaders(),
    });

    return this.transform(data);
  }

  async searchHtml(query) {
    const searchUrl = `${config.searchUrl}${encodeURIComponent(query.text || '')}`;
    
    const response = await httpClient.get(searchUrl, {
      timeout: this.timeout,
      headers: {
        ...this.getHeaders(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    return parseHtmlResults(response.data);
  }

  buildQueryParams(query) {
    return {
      texto: query.text || '',
      pagina: query.page || Math.floor((query.offset || 0) / (query.limit || 24)) + 1,
      num: query.limit || 24,
      orden: this.mapSortOption(query.sort),
      formato: 'json',
    };
  }

  transform(rawData) {
    return transformTodocoleccionResponse(rawData);
  }

  mapSortOption(sort) {
    const sortMap = {
      'newest': 'fecha_desc',
      'oldest': 'fecha_asc',
      'price_asc': 'precio_asc',
      'price_desc': 'precio_desc',
      'relevance': 'relevancia',
    };
    return sortMap[sort] || 'fecha_desc';
  }

  getHeaders() {
    return {
      ...super.getHeaders(),
      'Accept': 'application/json, text/plain, */*',
      'Origin': this.baseUrl,
      'Referer': this.baseUrl,
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    };
  }
}

export default TodocoleccionPlatform;
