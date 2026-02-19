import BasePlatform from '../base/BasePlatform.js';
import { httpClient } from '../../utils/httpClient.js';
import config from './leboncoin.config.js';
import { transformLeboncoinResponse } from './leboncoin.transformer.js';

/**
 * Leboncoin platform implementation
 * French classifieds marketplace
 */
class LeboncoinPlatform extends BasePlatform {
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

      const body = this.buildRequestBody(query);
      
      // Leboncoin uses POST for search
      const response = await httpClient.post(this.apiUrl, body, {
        timeout: this.timeout,
        headers: this.getHeaders(),
      });

      return this.transform(response.data);
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
    // Leboncoin uses POST body, not query params
    return {};
  }

  buildRequestBody(query) {
    const body = {
      limit: query.limit || 35,
      offset: query.offset || 0,
      sort_by: this.mapSortOption(query.sort),
      sort_order: query.sort?.includes('asc') ? 'asc' : 'desc',
      keyword: query.text || '',
      owner_type: 'all', // 'private', 'pro', or 'all'
    };

    // Add filters
    const filters = {};

    if (query.minPrice || query.maxPrice) {
      filters.price = {};
      if (query.minPrice) filters.price.min = query.minPrice;
      if (query.maxPrice) filters.price.max = query.maxPrice;
    }

    if (query.category) {
      filters.category = { id: query.category };
    }

    if (query.location) {
      filters.location = { region: query.location };
    }

    if (Object.keys(filters).length > 0) {
      body.filters = filters;
    }

    return body;
  }

  transform(rawData) {
    return transformLeboncoinResponse(rawData);
  }

  mapSortOption(sort) {
    const sortMap = {
      'newest': 'date',
      'oldest': 'date',
      'price_asc': 'price',
      'price_desc': 'price',
      'relevance': 'relevance',
    };
    return sortMap[sort] || 'date';
  }

  getHeaders() {
    const cookieString = this.cookies 
      ? (Array.isArray(this.cookies) 
          ? this.cookies.map(c => c.split(';')[0]).join('; ')
          : this.cookies)
      : '';

    return {
      ...super.getHeaders(),
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': this.baseUrl,
      'Referer': `${this.baseUrl}/`,
      'Cookie': cookieString,
      'api_key': 'ba0c2dad52b3ec', // Public API key
    };
  }
}

export default LeboncoinPlatform;
