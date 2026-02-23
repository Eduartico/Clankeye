import OlxPtScraper from './platforms/OlxPtScraper.js';
import OlxBrScraper from './platforms/OlxBrScraper.js';
import OlxPlScraper from './platforms/OlxPlScraper.js';
import VintedScraper from './platforms/VintedScraper.js';
import EbayScraper from './platforms/EbayScraper.js';
import WallapopScraper from './platforms/WallapopScraper.js';
import TodocoleccionScraper from './platforms/TodocoleccionScraper.js';
import LeboncoinScraper from './platforms/LeboncoinScraper.js';

/**
 * Registry of all available Crawlee scrapers.
 * Each scraper targets one marketplace and knows how to build URLs + extract items.
 */
export const scrapers = {
  'olx-pt': OlxPtScraper,
  'olx-br': OlxBrScraper,
  'olx-pl': OlxPlScraper,
  'vinted': VintedScraper,
  'ebay': EbayScraper,
  'wallapop': WallapopScraper,
  'todocoleccion': TodocoleccionScraper,
  'leboncoin': LeboncoinScraper,
};

/**
 * Create a scraper instance by platform name
 * @param {string} name - Platform name (e.g., 'ebay', 'olx-pt')
 * @param {object} config - Optional config overrides
 * @returns {BaseScraper} Scraper instance
 */
export function createScraper(name, config = {}) {
  const ScraperClass = scrapers[name];
  if (!ScraperClass) {
    throw new Error(`Unknown scraper: "${name}". Available: ${Object.keys(scrapers).join(', ')}`);
  }
  return new ScraperClass(config);
}

/**
 * Get all available scraper names
 */
export function getScraperNames() {
  return Object.keys(scrapers);
}

export default scrapers;
