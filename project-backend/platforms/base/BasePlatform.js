import PlatformStatus from '../../models/PlatformStatus.js';

/**
 * Abstract base class for all marketplace platforms.
 * Each platform must extend this class and implement the required methods.
 */
class BasePlatform {
  constructor(config) {
    if (new.target === BasePlatform) {
      throw new Error('BasePlatform is abstract and cannot be instantiated directly');
    }

    this.name = config.name;
    this.displayName = config.displayName;
    this.baseUrl = config.baseUrl;
    this.apiUrl = config.apiUrl || config.baseUrl;
    this.enabled = config.enabled ?? true;
    this.rateLimit = config.rateLimit || { requests: 10, period: 1000 };
    this.timeout = config.timeout || 15000;
    this.region = config.region || null;
    this.country = config.country || null;
    this.currency = config.currency || 'EUR';
    this.requiresAuth = config.requiresAuth || false;
    this.requiresCookies = config.requiresCookies || false;
  }

  /**
   * Search for items on this platform
   * @param {SearchQuery} query - Standardized search parameters
   * @returns {Promise<Item[]>} - Array of normalized Item objects
   */
  async search(query) {
    throw new Error('search() must be implemented by subclass');
  }

  /**
   * Transform raw API response to Item model
   * @param {Object} rawData - Raw API response
   * @returns {Item[]} - Normalized items
   */
  transform(rawData) {
    throw new Error('transform() must be implemented by subclass');
  }

  /**
   * Build platform-specific query parameters
   * @param {SearchQuery} query - Standardized query
   * @returns {Object} - Platform-specific params
   */
  buildQueryParams(query) {
    throw new Error('buildQueryParams() must be implemented by subclass');
  }

  /**
   * Check if platform is healthy/accessible
   * @returns {Promise<PlatformStatus>}
   */
  async healthCheck() {
    const startTime = Date.now();
    try {
      // Default implementation - try a simple search
      await this.search({ text: 'test', limit: 1 });
      return new PlatformStatus({
        name: this.name,
        displayName: this.displayName,
        status: 'healthy',
        latency: Date.now() - startTime,
      });
    } catch (error) {
      return new PlatformStatus({
        name: this.name,
        displayName: this.displayName,
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message,
      });
    }
  }

  /**
   * Get platform-specific configuration
   * @returns {Object}
   */
  getConfig() {
    return {
      name: this.name,
      displayName: this.displayName,
      enabled: this.enabled,
      region: this.region,
      country: this.country,
      currency: this.currency,
      requiresAuth: this.requiresAuth,
    };
  }

  /**
   * Get default headers for requests
   * @returns {Object}
   */
  getHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    };
  }

  /**
   * Map standard sort option to platform-specific sort
   * @param {string} sort - Standard sort option
   * @returns {string} - Platform-specific sort
   */
  mapSortOption(sort) {
    // Override in subclass for platform-specific mapping
    return sort;
  }

  /**
   * Log platform activity
   * @param {string} message
   * @param {string} level - 'info', 'warn', 'error'
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.name.toUpperCase()}]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ERROR: ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} WARN: ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}

export default BasePlatform;
