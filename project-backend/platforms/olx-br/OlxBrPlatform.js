import BasePlatform from '../base/BasePlatform.js';
import { httpClient } from '../../utils/httpClient.js';
import config from './olx-br.config.js';
import { transformOlxBrResponse } from './olx-br.transformer.js';

/**
 * OLX Brasil platform implementation
 */
class OlxBrPlatform extends BasePlatform {
  constructor() {
    super(config);
  }

  async search(query) {
    try {
      const params = this.buildQueryParams(query);
      
      const response = await httpClient.get(this.apiUrl, {
        params,
        timeout: this.timeout,
        headers: this.getHeaders(),
      });

      return this.transform(response.data);
    } catch (error) {
      this.log(`Search failed: ${error.message}`, 'error');
      throw error;
    }
  }

  buildQueryParams(query) {
    return {
      offset: query.offset || 0,
      limit: query.limit || 30,
      query: query.text || '',
      filter_refiners: 'spell_checker',
      suggest_filters: 'true',
    };
  }

  transform(rawData) {
    return transformOlxBrResponse(rawData);
  }

  mapSortOption(sort) {
    const sortMap = {
      'newest': 'created_at:desc',
      'oldest': 'created_at:asc',
      'price_asc': 'price:asc',
      'price_desc': 'price:desc',
      'relevance': 'relevance:desc',
    };
    return sortMap[sort] || 'created_at:desc';
  }

  getHeaders() {
    return {
      ...super.getHeaders(),
      'Accept': 'application/json',
      'Origin': this.baseUrl,
      'Referer': this.baseUrl,
    };
  }
}

export default OlxBrPlatform;
