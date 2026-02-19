import BasePlatform from '../base/BasePlatform.js';
import { httpClient } from '../../utils/httpClient.js';
import config from './ebay.config.js';
import { transformEbayResponse } from './ebay.transformer.js';

/**
 * eBay platform implementation
 * Requires OAuth authentication for API access
 */
class EbayPlatform extends BasePlatform {
  constructor() {
    super(config);
    this.accessToken = null;
    this.tokenExpiry = null;
    this.marketplace = config.marketplaces.us;
  }

  async search(query) {
    try {
      // Ensure we have a valid token
      await this.ensureAuthenticated();

      const params = this.buildQueryParams(query);
      
      const response = await httpClient.get(this.apiUrl, {
        params,
        timeout: this.timeout,
        headers: this.getHeaders(),
      });

      return this.transform(response.data);
    } catch (error) {
      // Reset token on auth error
      if (error.response?.status === 401) {
        this.accessToken = null;
        this.tokenExpiry = null;
      }
      this.log(`Search failed: ${error.message}`, 'error');
      throw error;
    }
  }

  buildQueryParams(query) {
    const params = {
      q: query.text || '',
      limit: Math.min(query.limit || 50, 200), // eBay max is 200
      offset: query.offset || 0,
      sort: this.mapSortOption(query.sort),
    };

    // Build filter string
    const filters = [];

    if (query.minPrice || query.maxPrice) {
      const priceFilter = [];
      if (query.minPrice) priceFilter.push(`[${query.minPrice}`);
      else priceFilter.push('[');
      priceFilter.push('..');
      if (query.maxPrice) priceFilter.push(`${query.maxPrice}]`);
      else priceFilter.push(']');
      filters.push(`price:${priceFilter.join('')}`);
    }

    if (query.condition) {
      filters.push(`conditions:{${query.condition}}`);
    }

    if (filters.length > 0) {
      params.filter = filters.join(',');
    }

    return params;
  }

  transform(rawData) {
    return transformEbayResponse(rawData);
  }

  mapSortOption(sort) {
    const sortMap = {
      'newest': 'newlyListed',
      'oldest': '-newlyListed',
      'price_asc': 'price',
      'price_desc': '-price',
      'relevance': 'bestMatch',
    };
    return sortMap[sort] || 'bestMatch';
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'X-EBAY-C-MARKETPLACE-ID': this.marketplace,
      'X-EBAY-C-ENDUSERCTX': 'affiliateCampaignId=<ePNCampaignId>,affiliateReferenceId=<referenceId>',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Ensure we have a valid OAuth token
   */
  async ensureAuthenticated() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return; // Token still valid
    }

    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('eBay API credentials not configured. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET environment variables.');
    }

    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const response = await httpClient.post(
        config.oauth.authUrl,
        'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer
      
      this.log('Successfully authenticated with eBay API');
    } catch (error) {
      this.log(`Authentication failed: ${error.message}`, 'error');
      throw new Error('Failed to authenticate with eBay API');
    }
  }

  /**
   * Set marketplace for eBay
   */
  setMarketplace(region) {
    const marketplaceId = config.marketplaces[region];
    if (marketplaceId) {
      this.marketplace = marketplaceId;
      this.region = region;
    }
  }

  /**
   * Health check - verify API credentials
   */
  async healthCheck() {
    const startTime = Date.now();
    try {
      await this.ensureAuthenticated();
      return {
        name: this.name,
        displayName: this.displayName,
        status: 'healthy',
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name: this.name,
        displayName: this.displayName,
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}

export default EbayPlatform;
