import BasePlatform from '../base/BasePlatform.js';
import { httpClient } from '../../utils/httpClient.js';
import config from './vinted.config.js';
import { transformVintedResponse } from './vinted.transformer.js';

/**
 * Vinted platform implementation
 * Uses cookie-based authentication for API access
 */
class VintedPlatform extends BasePlatform {
  constructor() {
    super(config);
    this.cookies = null;
  }

  async search(query) {
    try {
      // Fetch cookies if needed
      if (!this.cookies) {
        this.cookies = await httpClient.fetchCookies(this.baseUrl);
      }

      const params = this.buildQueryParams(query);
      
      const data = await httpClient.getWithCookies(this.apiUrl, this.cookies, params, {
        timeout: this.timeout,
        headers: this.getHeaders(),
      });

      return this.transform(data);
    } catch (error) {
      // Reset cookies on auth error
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.cookies = null;
      }
      this.log(`Search failed: ${error.message}`, 'error');
      throw error;
    }
  }

  buildQueryParams(query) {
    const params = {
      search_text: query.text || '',
      page: query.page || Math.floor((query.offset || 0) / (query.limit || 96)) + 1,
      per_page: query.limit || 96,
      order: this.mapSortOption(query.sort),
    };

    if (query.currency) {
      params.currency = query.currency;
    }

    if (query.minPrice) {
      params.price_from = query.minPrice;
    }

    if (query.maxPrice) {
      params.price_to = query.maxPrice;
    }

    if (query.category) {
      params.catalog_ids = query.category;
    }

    return params;
  }

  transform(rawData) {
    return transformVintedResponse(rawData);
  }

  mapSortOption(sort) {
    const sortMap = {
      'newest': 'newest_first',
      'oldest': 'oldest_first',
      'price_asc': 'price_low_to_high',
      'price_desc': 'price_high_to_low',
      'relevance': 'relevance',
    };
    return sortMap[sort] || 'newest_first';
  }

  getHeaders() {
    return {
      ...super.getHeaders(),
      'Accept': 'application/json, text/plain, */*',
      'Origin': this.baseUrl,
      'Referer': `${this.baseUrl}/`,
    };
  }

  /**
   * Set regional domain for Vinted
   */
  setRegion(region) {
    const domain = config.regionalDomains[region];
    if (domain) {
      this.baseUrl = domain;
      this.apiUrl = `${domain}/api/v2/catalog/items`;
      this.region = region;
      this.cookies = null; // Reset cookies for new domain
    }
  }
}

export default VintedPlatform;
