/**
 * ⚡ Search Orchestrator - Parallel Crawlee Search with Pagination & Dedup
 * 
 * This service manages:
 * 1. Parallel scraping across all platforms using Crawlee
 * 2. Per-platform page tracking for "get more items"
 * 3. Time-sorted result merging (interleaved timeline)
 * 4. Duplicate detection across platforms
 */

import { createScraper, getScraperNames } from '../scrapers/index.js';
import duplicateDetector from './duplicateDetector.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DUMPS_DIR = join(__dirname, '..', 'data', 'dumps');

// How many platform scrapers run concurrently.
// Now safe at 8 because all scrapers share ONE Chromium browser via BrowserManager
// (each scraper gets a lightweight browser context instead of a full browser process).
const SCRAPER_CONCURRENCY = parseInt(process.env.SCRAPER_CONCURRENCY || '8', 10);

class SearchOrchestrator {
  constructor() {
    this.defaultConfig = {
      headless: true,
      maxRequestsPerCrawl: 1,
      requestHandlerTimeoutSecs: 90,
      navigationTimeoutSecs: 60,
    };
    // Ensure dumps directory exists
    try { mkdirSync(DUMPS_DIR, { recursive: true }); } catch {}
  }

  /**
   * Write search results to dump files (overwrites each search).
   * One file per platform + one final processed list.
   */
  _dumpResults(query, perPlatformResults, finalItems) {
    try {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      // Per-platform raw results
      for (const result of perPlatformResults) {
        const filename = `${result.platform}.json`;
        writeFileSync(
          join(DUMPS_DIR, filename),
          JSON.stringify({ query, platform: result.platform, page: result.page, count: result.items.length, items: result.items }, null, 2),
          'utf-8'
        );
      }
      // Final processed list
      writeFileSync(
        join(DUMPS_DIR, 'final.json'),
        JSON.stringify({ query, timestamp: new Date().toISOString(), count: finalItems.length, items: finalItems }, null, 2),
        'utf-8'
      );
      console.log(`[Orchestrator] 💾 Dumped results to ${DUMPS_DIR} (${perPlatformResults.length} platforms + final.json)`);
    } catch (err) {
      console.error(`[Orchestrator] Failed to dump results: ${err.message}`);
    }
  }

  /**
   * Run an array of async task functions with at most `limit` running at once.
   * Returns results in the same order as tasks (like Promise.all).
   */
  async _pool(tasks, limit) {
    const results = new Array(tasks.length);
    let nextIndex = 0;

    async function worker() {
      while (nextIndex < tasks.length) {
        const i = nextIndex++;
        results[i] = await tasks[i]();
      }
    }

    const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
    await Promise.all(workers);
    return results;
  }

  /**
   * Search across multiple platforms IN PARALLEL
   * 
   * @param {Object} params
   * @param {string} params.query - Search term
   * @param {string[]} [params.platforms] - Platforms to search (defaults to all)
   * @param {Object} [params.pages] - Per-platform page numbers, e.g. { "ebay": 1, "vinted": 2 }
   * @param {Object} [params.config] - Scraper config overrides
   * @param {boolean} [params.detectDuplicates=true] - Whether to run duplicate detection
   * @returns {Promise<Object>} Search results with items, stats, and duplicates
   */
  async search({ query, platforms, pages = {}, config = {}, detectDuplicates = true, vintedCountry = 'pt' }) {
    if (!query || !query.trim()) {
      throw new Error('Search query is required');
    }

    // Determine which platforms to search
    const allPlatforms = getScraperNames();
    const selectedPlatforms = platforms?.length
      ? platforms.filter(p => allPlatforms.includes(p))
      : allPlatforms;

    if (selectedPlatforms.length === 0) {
      throw new Error(`No valid platforms. Available: ${allPlatforms.join(', ')}`);
    }

    const scraperConfig = { ...this.defaultConfig, ...config };
    const overallStart = Date.now();

    // Build Vinted domain from country code (e.g. 'pt' → https://www.vinted.pt)
    const vintedDomain = `https://www.vinted.${vintedCountry || 'pt'}`;

    // ⚡ Run scrapers with concurrency cap (avoids launching 8 browsers at once)
    console.log(`[Orchestrator] Starting search for "${query}" across ${selectedPlatforms.length} platforms (concurrency: ${SCRAPER_CONCURRENCY})`);
    const tasks = selectedPlatforms.map(platformName => {
      // Inject Vinted domain into config for the vinted scraper
      const platformConfig = platformName === 'vinted'
        ? { ...scraperConfig, domain: vintedDomain }
        : scraperConfig;
      return () => this._scrapePlatform(platformName, query, pages[platformName] || 1, platformConfig);
    });
    const results = await this._pool(tasks, SCRAPER_CONCURRENCY);

    const wallTimeMs = Date.now() - overallStart;

    // Collect all items, stats, errors
    const allItems = [];
    const platformStats = {};
    const errors = {};

    for (const result of results) {
      platformStats[result.platform] = {
        page: result.page,
        count: result.items.length,
        timeMs: result.elapsed,
        success: !result.error,
      };

      if (result.error) {
        errors[result.platform] = result.error;
      }

      // Tag each item with its source platform if not already tagged
      const taggedItems = result.items.map(item => ({
        ...item,
        source: item.source || result.platform,
        _scrapedAt: new Date().toISOString(),
      }));

      allItems.push(...taggedItems);
    }

    // Sort items by time (newest first), spread undated items among dated
    const sortedItems = this._sortByTime(allItems);

    // Detect duplicates across platforms
    let duplicateGroups = [];
    let annotatedItems = sortedItems;

    if (detectDuplicates && sortedItems.length > 0) {
      duplicateGroups = duplicateDetector.detectDuplicates(sortedItems);
      annotatedItems = duplicateDetector.annotateItems(sortedItems, duplicateGroups);
    }

    // Dump results to files (overwrites each search)
    this._dumpResults(query, results, annotatedItems);

    return {
      items: annotatedItems,
      platformStats,
      errors,
      duplicateGroups,
      meta: {
        query,
        totalItems: annotatedItems.length,
        platforms: selectedPlatforms,
        pages,
        wallTimeMs,
        mode: 'parallel',
        searchedAt: new Date().toISOString(),
        duplicatesFound: duplicateGroups.length,
      },
    };
  }

  /**
   * "Get more items" for specific platforms.
   * Fetches the next page for the given platforms and merges with existing items.
   * 
   * @param {Object} params
   * @param {string} params.query - Search term
   * @param {string[]} params.platforms - Which platforms to fetch more from
   * @param {Object} params.pages - Per-platform page numbers (should be incremented by caller)
   * @param {Array} [params.existingItems=[]] - Previously fetched items for dedup merging
   * @returns {Promise<Object>} New items + updated duplicate groups
   */
  async getMore({ query, platforms, pages, existingItems = [], config = {}, vintedCountry = 'pt' }) {
    if (!platforms?.length) {
      throw new Error('Specify which platforms to fetch more items from');
    }

    // Scrape only the requested platforms with their page numbers
    const result = await this.search({
      query,
      platforms,
      pages,
      config,
      detectDuplicates: false, // We'll detect across ALL items below
      vintedCountry,
    });

    // Merge with existing items
    const allItems = [...existingItems, ...result.items];

    // Run duplicate detection across the full set
    const duplicateGroups = duplicateDetector.detectDuplicates(allItems);
    const annotatedNewItems = duplicateDetector.annotateItems(result.items, duplicateGroups);

    return {
      newItems: annotatedNewItems,
      platformStats: result.platformStats,
      errors: result.errors,
      duplicateGroups,
      meta: {
        ...result.meta,
        isLoadMore: true,
        existingItemCount: existingItems.length,
        newItemCount: result.items.length,
        totalAfterMerge: allItems.length,
      },
    };
  }

  /**
   * Scrape a single platform (internal)
   */
  async _scrapePlatform(platformName, query, page, config) {
    const startTime = Date.now();
    try {
      const scraper = createScraper(platformName, config);
      const items = await scraper.search(query, page);
      return {
        platform: platformName,
        page,
        items,
        elapsed: Date.now() - startTime,
        error: null,
      };
    } catch (error) {
      return {
        platform: platformName,
        page,
        items: [],
        elapsed: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Sort items by time (newest first).
   * Items WITHOUT a real date are spread evenly among items WITH dates
   * instead of being pushed to the end. If 80% have dates and 20% don't,
   * roughly 1 undated item appears every 4 dated items.
   */
  _sortByTime(items) {
    // Separate items into dated and undated buckets
    const dated = [];
    const undated = [];

    for (const item of items) {
      // Only use real date fields, NOT _scrapedAt
      const timeVal = item.createdTime || item.date || item.time;
      const parsed = this._parseTime(timeVal);
      if (parsed) {
        dated.push({ item, time: parsed });
      } else {
        undated.push(item);
      }
    }

    // Sort dated items newest-first
    dated.sort((a, b) => b.time - a.time);

    // If no undated items, just return the sorted dated list
    if (undated.length === 0) return dated.map(d => d.item);
    // If no dated items, return undated in original order
    if (dated.length === 0) return undated;

    // Interleave undated items among dated items
    // Ratio: every N dated items, insert 1 undated
    const ratio = Math.max(1, Math.floor(dated.length / undated.length));
    const merged = [];
    let undatedIdx = 0;

    for (let i = 0; i < dated.length; i++) {
      merged.push(dated[i].item);
      // After every `ratio` dated items, insert an undated one
      if ((i + 1) % ratio === 0 && undatedIdx < undated.length) {
        merged.push(undated[undatedIdx++]);
      }
    }

    // Append any remaining undated items
    while (undatedIdx < undated.length) {
      merged.push(undated[undatedIdx++]);
    }

    return merged;
  }

  /**
   * Parse time from various formats to a timestamp.
   * Handles ISO strings, relative strings ("il y a 2 heures", "hace 3 días",
   * "há 5 horas", "2 hours ago", "vor 1 Tag"), and numeric timestamps.
   * Also handles Portuguese dates like "Hoje às 14:30", "23 de fevereiro de 2026",
   * Polish dates like "Dzisiaj o 14:30", and OLX "Para o topo a ..." patterns.
   */
  _parseTime(timeValue) {
    if (!timeValue) return null;
    if (timeValue instanceof Date) return timeValue.getTime();
    if (typeof timeValue === 'number') return timeValue;

    const str = String(timeValue).trim();

    // Strip "Para o topo a " / "Odświeżono " prefix (OLX bump/boost indicators)
    const cleaned = str.replace(/^(Para o topo a|Odświeżono|Promoted|Destacado)\s+/i, '').trim();

    // Try ISO / standard date parse first
    const parsed = Date.parse(cleaned);
    if (!isNaN(parsed)) return parsed;

    // ── Relative time patterns (multilingual) ─────────────────────
    const now = Date.now();
    const lower = cleaned.toLowerCase();

    // Extract the numeric part
    const numMatch = lower.match(/(\d+)/);
    const num = numMatch ? parseInt(numMatch[1], 10) : 1;

    // Minutes
    if (/minut|min\b/.test(lower)) return now - num * 60 * 1000;
    // Hours
    if (/hour|heure|hora|stund|godzin|timm|uur/.test(lower)) return now - num * 3600 * 1000;
    // Days
    if (/day|jour|día|dia|tag|dzień|dag/.test(lower)) return now - num * 86400 * 1000;
    // Weeks
    if (/week|semaine|semana|woche|tydzień|tydz/.test(lower)) return now - num * 7 * 86400 * 1000;
    // Months
    if (/month|mois|mes|monat|miesi/.test(lower)) return now - num * 30 * 86400 * 1000;

    // "today" / "aujourd'hui" / "hoy" / "hoje" / "heute" / "dziś" (with optional time)
    if (/today|aujourd|hoy|hoje|heute|dziś|dzisiaj|vandaag/.test(lower)) {
      // Try to parse time like "Hoje às 14:30" or "Dzisiaj o 09:43"
      const timeMatch = lower.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const d = new Date();
        d.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
        return d.getTime();
      }
      return now;
    }

    // "yesterday" etc. (with optional time)
    if (/yesterday|hier|ayer|ontem|gestern|wczoraj/.test(lower)) {
      const timeMatch = lower.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const d = new Date(now - 86400 * 1000);
        d.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
        return d.getTime();
      }
      return now - 86400 * 1000;
    }

    // Portuguese full dates: "23 de fevereiro de 2026"
    const ptMonths = { janeiro: 0, fevereiro: 1, março: 2, marco: 2, abril: 3, maio: 4, junho: 5, julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11 };
    const ptMatch = lower.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
    if (ptMatch) {
      const month = ptMonths[ptMatch[2]];
      if (month !== undefined) {
        const d = new Date(parseInt(ptMatch[3], 10), month, parseInt(ptMatch[1], 10));
        // Also try to capture time if present: "23 de fevereiro de 2026, 14:30"
        const timeMatch = lower.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) d.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10));
        return d.getTime();
      }
    }

    // Polish month names: "23 lut 2026" / "23 lutego 2026"
    const plMonths = { sty: 0, lut: 1, mar: 2, kwi: 3, maj: 4, cze: 5, lip: 6, sie: 7, wrz: 8, paź: 9, paz: 9, lis: 10, gru: 11, stycznia: 0, lutego: 1, marca: 2, kwietnia: 3, maja: 4, czerwca: 5, lipca: 6, sierpnia: 7, września: 8, wrzesnia: 8, października: 9, pazdziernika: 9, listopada: 10, grudnia: 11 };
    const plMatch = lower.match(/(\d{1,2})\s+(\w+)\.?\s+(\d{4})/);
    if (plMatch) {
      const month = plMonths[plMatch[2].replace(/\./g, '')];
      if (month !== undefined) {
        return new Date(parseInt(plMatch[3], 10), month, parseInt(plMatch[1], 10)).getTime();
      }
    }

    // Spanish month names: "23 feb 2026" / "23 febrero 2026"
    const esMonths = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11, enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
    const esMatch = lower.match(/(\d{1,2})\s+(\w+)\.?\s+(\d{4})/);
    if (esMatch) {
      const month = esMonths[esMatch[2].replace(/\./g, '')];
      if (month !== undefined) {
        return new Date(parseInt(esMatch[3], 10), month, parseInt(esMatch[1], 10)).getTime();
      }
    }

    // French month names: "23 fév 2026" / "23 février 2026"
    const frMonths = { jan: 0, fév: 1, fev: 1, mar: 2, avr: 3, mai: 4, juin: 5, juil: 6, aoû: 7, aou: 7, sep: 8, oct: 9, nov: 10, déc: 11, dec: 11, janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11, decembre: 11 };
    const frMatch = lower.match(/(\d{1,2})\s+(\w+)\.?\s+(\d{4})/);
    if (frMatch) {
      const month = frMonths[frMatch[2].replace(/\./g, '')];
      if (month !== undefined) {
        return new Date(parseInt(frMatch[3], 10), month, parseInt(frMatch[1], 10)).getTime();
      }
    }

    // Short date without year: "23 Feb" / "23 fev" — assume current year
    const shortMatch = lower.match(/^(\d{1,2})\s+(\w{3,})\.?$/);
    if (shortMatch) {
      const allMonths = { ...ptMonths, ...plMonths, ...esMonths, ...frMonths, jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
      const month = allMonths[shortMatch[2].replace(/\./g, '')];
      if (month !== undefined) {
        return new Date(new Date().getFullYear(), month, parseInt(shortMatch[1], 10)).getTime();
      }
    }

    return null;
  }

  /**
   * Search with per-platform callbacks so callers can stream/react as each
   * platform finishes, while still respecting the SCRAPER_CONCURRENCY cap.
   *
   * @param {Object} params
   * @param {string} params.query
   * @param {string[]} [params.platforms]
   * @param {Object}  [params.pages]
   * @param {Object}  [params.config]
   * @param {string}  [params.vintedCountry]
   * @param {(platform: string) => void} [params.onPlatformStart]
   * @param {(platform: string, result: Object) => void} [params.onPlatformDone]
   */
  async searchWithCallback({
    query,
    platforms,
    pages = {},
    config = {},
    vintedCountry = 'pt',
    onPlatformStart = null,
    onPlatformDone = null,
  }) {
    if (!query?.trim()) throw new Error('Search query is required');

    const allPlatforms = getScraperNames();
    const selectedPlatforms = platforms?.length
      ? platforms.filter(p => allPlatforms.includes(p))
      : allPlatforms;

    if (selectedPlatforms.length === 0) {
      throw new Error(`No valid platforms. Available: ${allPlatforms.join(', ')}`);
    }

    const scraperConfig = { ...this.defaultConfig, ...config };
    const vintedDomain = `https://www.vinted.${vintedCountry || 'pt'}`;

    // Accumulate results for dumping
    const allResults = [];

    const tasks = selectedPlatforms.map(platformName => async () => {
      onPlatformStart?.(platformName);

      const platformConfig = platformName === 'vinted'
        ? { ...scraperConfig, domain: vintedDomain }
        : scraperConfig;

      const result = await this._scrapePlatform(
        platformName,
        query,
        pages[platformName] || 1,
        platformConfig,
      );

      allResults.push(result);
      onPlatformDone?.(platformName, result);
      return result;
    });

    const results = await this._pool(tasks, SCRAPER_CONCURRENCY);

    // Dump results to files after all platforms finish
    const allItems = allResults.flatMap(r =>
      r.items.map(item => ({ ...item, source: item.source || r.platform }))
    );
    const sortedItems = this._sortByTime(allItems);
    this._dumpResults(query, allResults, sortedItems);

    return results;
  }

  /**
   * Get list of available platform names
   */
  getAvailablePlatforms() {
    return getScraperNames();
  }
}

// Export singleton instance
export const searchOrchestrator = new SearchOrchestrator();
export default searchOrchestrator;
