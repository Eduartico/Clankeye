import BasePlatform from '../base/BasePlatform.js';
import { httpClient } from '../../utils/httpClient.js';
import config from './wallapop.config.js';
import { transformWallapopResponse } from './wallapop.transformer.js';

/**
 * Wallapop platform implementation
 */
class WallapopPlatform extends BasePlatform {
  constructor() {
    super(config);
    // Default location coordinates (Madrid, Spain)
    this.latitude = 40.4168;
    this.longitude = -3.7038;
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
    const params = {
      keywords: query.text || '',
      start: query.offset || 0,
      num: query.limit || 40,
      order_by: this.mapSortOption(query.sort),
      latitude: this.latitude,
      longitude: this.longitude,
      distance: 200000, // 200km radius by default
    };

    if (query.minPrice) {
      params.min_sale_price = query.minPrice * 100; // Wallapop uses cents
    }

    if (query.maxPrice) {
      params.max_sale_price = query.maxPrice * 100;
    }

    if (query.category) {
      params.category_ids = query.category;
    }

    return params;
  }

  transform(rawData) {
    return transformWallapopResponse(rawData);
  }

  mapSortOption(sort) {
    const sortMap = {
      'newest': 'creationDate-des',
      'oldest': 'creationDate-asc',
      'price_asc': 'salePrice-asc',
      'price_desc': 'salePrice-des',
      'relevance': 'score-des',
    };
    return sortMap[sort] || 'creationDate-des';
  }

  getHeaders() {
    return {
      ...super.getHeaders(),
      'Accept': 'application/json, text/plain, */*',
      'Origin': this.baseUrl,
      'Referer': `${this.baseUrl}/`,
      'DeviceOS': '0', // Web
    };
  }

  /**
   * Set location for distance-based search
   */
  setLocation(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  /**
   * Set region for Wallapop
   */
  setRegion(region) {
    const regionalUrl = config.regionalUrls[region];
    if (regionalUrl) {
      this.baseUrl = regionalUrl;
      this.region = region;
    }
  }
}

export default WallapopPlatform;
