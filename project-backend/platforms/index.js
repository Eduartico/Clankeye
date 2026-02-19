import OlxPtPlatform from './olx-pt/OlxPtPlatform.js';
import OlxBrPlatform from './olx-br/OlxBrPlatform.js';
import OlxPlPlatform from './olx-pl/OlxPlPlatform.js';
import VintedPlatform from './vinted/VintedPlatform.js';
import EbayPlatform from './ebay/EbayPlatform.js';
import WallapopPlatform from './wallapop/WallapopPlatform.js';
import TodocoleccionPlatform from './todocoleccion/TodocoleccionPlatform.js';
import LeboncoinPlatform from './leboncoin/LeboncoinPlatform.js';

/**
 * Platform Registry - Single source of truth for all marketplace platforms
 * Handles registration, retrieval, and management of platform instances
 */
class PlatformRegistry {
  constructor() {
    this.platforms = new Map();
    this.registerDefaults();
  }

  /**
   * Register all default platforms
   */
  registerDefaults() {
    // OLX variants
    this.register('olx-pt', OlxPtPlatform);
    this.register('olx-br', OlxBrPlatform);
    this.register('olx-pl', OlxPlPlatform);
    
    // Other platforms
    this.register('vinted', VintedPlatform);
    this.register('ebay', EbayPlatform);
    this.register('wallapop', WallapopPlatform);
    this.register('todocoleccion', TodocoleccionPlatform);
    this.register('leboncoin', LeboncoinPlatform);
  }

  /**
   * Register a platform
   * @param {string} name - Platform identifier
   * @param {class} PlatformClass - Platform class to instantiate
   */
  register(name, PlatformClass) {
    try {
      this.platforms.set(name, new PlatformClass());
    } catch (error) {
      console.error(`Failed to register platform ${name}:`, error.message);
    }
  }

  /**
   * Get a platform by name
   * @param {string} name - Platform identifier
   * @returns {BasePlatform|undefined}
   */
  get(name) {
    return this.platforms.get(name);
  }

  /**
   * Get all registered platforms
   * @returns {BasePlatform[]}
   */
  getAll() {
    return Array.from(this.platforms.values());
  }

  /**
   * Get all enabled platforms
   * @returns {BasePlatform[]}
   */
  getEnabled() {
    return this.getAll().filter(p => p.enabled);
  }

  /**
   * Get platforms by name array
   * @param {string[]} names - Platform names
   * @returns {BasePlatform[]}
   */
  getByNames(names) {
    return names
      .map(n => this.get(n.toLowerCase().trim()))
      .filter(Boolean);
  }

  /**
   * Get all platform names
   * @returns {string[]}
   */
  getNames() {
    return Array.from(this.platforms.keys());
  }

  /**
   * Get platform configurations
   * @returns {Object[]}
   */
  getConfigs() {
    return this.getAll().map(p => p.getConfig());
  }

  /**
   * Check if a platform exists
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this.platforms.has(name);
  }

  /**
   * Enable/disable a platform
   * @param {string} name
   * @param {boolean} enabled
   */
  setEnabled(name, enabled) {
    const platform = this.get(name);
    if (platform) {
      platform.enabled = enabled;
    }
  }

  /**
   * Get platforms by region
   * @param {string} region - Region code (e.g., 'pt', 'fr', 'es')
   * @returns {BasePlatform[]}
   */
  getByRegion(region) {
    return this.getAll().filter(p => p.region === region);
  }

  /**
   * Get platforms by country
   * @param {string} country - Country name
   * @returns {BasePlatform[]}
   */
  getByCountry(country) {
    return this.getAll().filter(p => 
      p.country?.toLowerCase() === country.toLowerCase()
    );
  }
}

// Export singleton instance
export const platformRegistry = new PlatformRegistry();
export default platformRegistry;
