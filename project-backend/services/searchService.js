import platformRegistry from '../platforms/index.js';
import SearchQuery from '../models/SearchQuery.js';

/**
 * Search Service - Orchestrates searches across multiple platforms
 */
class SearchService {
  constructor() {
    this.registry = platformRegistry;
  }

  /**
   * Search across specified platforms
   * @param {Object} params - Search parameters
   * @param {string[]} params.platforms - Platform names to search
   * @param {string} params.query - Search text
   * @param {Object} params.options - Additional options (limit, offset, sort, etc.)
   * @returns {Promise<Object>} - Aggregated results
   */
  async search({ platforms, query, options = {} }) {
    const searchQuery = new SearchQuery({
      text: query,
      limit: options.limit || 50,
      offset: options.offset || 0,
      page: options.page || 1,
      sort: options.sort || 'relevance',
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      currency: options.currency,
      condition: options.condition,
      category: options.category,
      filters: options.filters || {},
    });

    // Get platforms to search
    const selectedPlatforms = platforms?.length
      ? this.registry.getByNames(platforms)
      : this.registry.getEnabled();

    if (selectedPlatforms.length === 0) {
      return {
        items: [],
        platforms: {},
        meta: {
          totalItems: 0,
          successfulPlatforms: 0,
          failedPlatforms: 0,
          query: query,
        },
      };
    }

    // Execute searches in parallel
    const results = await Promise.allSettled(
      selectedPlatforms.map(platform => 
        this.searchPlatform(platform, searchQuery)
      )
    );

    return this.aggregateResults(results, selectedPlatforms, query);
  }

  /**
   * Search a single platform
   * @param {BasePlatform} platform
   * @param {SearchQuery} query
   * @returns {Promise<Object>}
   */
  async searchPlatform(platform, query) {
    const startTime = Date.now();
    try {
      const items = await platform.search(query);
      return {
        platform: platform.name,
        displayName: platform.displayName,
        items,
        latency: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        platform: platform.name,
        displayName: platform.displayName,
        items: [],
        error: error.message,
        latency: Date.now() - startTime,
        success: false,
      };
    }
  }

  /**
   * Aggregate results from all platforms
   * @param {Array} results - Promise.allSettled results
   * @param {Array} platforms - Searched platforms
   * @param {string} query - Original query
   * @returns {Object}
   */
  aggregateResults(results, platforms, query) {
    const aggregated = {
      items: [],
      platforms: {},
      meta: {
        totalItems: 0,
        successfulPlatforms: 0,
        failedPlatforms: 0,
        query: query,
        searchedAt: new Date().toISOString(),
      },
    };

    results.forEach((result, index) => {
      const platform = platforms[index];
      const value = result.status === 'fulfilled' 
        ? result.value 
        : {
            platform: platform.name,
            displayName: platform.displayName,
            items: [],
            error: result.reason?.message || 'Unknown error',
            success: false,
            latency: 0,
          };

      // Store platform result
      aggregated.platforms[value.platform] = {
        displayName: value.displayName,
        success: value.success,
        itemCount: value.items.length,
        latency: value.latency,
        error: value.error || null,
      };

      // Add items and update meta
      if (value.success) {
        aggregated.items.push(...value.items);
        aggregated.meta.successfulPlatforms++;
      } else {
        aggregated.meta.failedPlatforms++;
      }
    });

    aggregated.meta.totalItems = aggregated.items.length;
    return aggregated;
  }

  /**
   * Search a specific platform by name
   * @param {string} platformName
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async searchSingle(platformName, { query, options = {} }) {
    const platform = this.registry.get(platformName);
    
    if (!platform) {
      throw new Error(`Platform '${platformName}' not found`);
    }

    const searchQuery = new SearchQuery({
      text: query,
      ...options,
    });

    return this.searchPlatform(platform, searchQuery);
  }

  /**
   * Get status of all platforms
   * @returns {Promise<Object[]>}
   */
  async getStatus() {
    const platforms = this.registry.getAll();
    const checks = await Promise.allSettled(
      platforms.map(p => p.healthCheck())
    );

    return platforms.map((platform, i) => ({
      ...platform.getConfig(),
      health: checks[i].status === 'fulfilled'
        ? checks[i].value
        : { status: 'error', error: checks[i].reason?.message },
    }));
  }

  /**
   * Get list of available platforms
   * @returns {Object[]}
   */
  getAvailablePlatforms() {
    return this.registry.getConfigs();
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;
