import { log } from 'crawlee';
import browserManager from './BrowserManager.js';

/**
 * Base class for all Crawlee-based platform scrapers.
 * Provides common functionality: browser launch, page logging, result collection.
 *
 * Environment variables:
 *   SCRAPER_TIMEOUT_SECS  - Max seconds to wait for a single platform (default 120)
 *   LOG_VERBOSE=true      - Enable full page-structure dumps (dev only)
 */

// How long (ms) before we give up on a single platform entirely
const SCRAPER_TIMEOUT_MS = parseInt(process.env.SCRAPER_TIMEOUT_SECS || '120', 10) * 1000;

// Only dump full page-structure analysis in verbose mode
const VERBOSE = process.env.LOG_VERBOSE === 'true';
class BaseScraper {
  constructor(platformName, config = {}) {
    this.platformName = platformName;
    this.results = [];
    this.config = {
      headless: config.headless ?? true,
      maxRequestsPerCrawl: config.maxRequestsPerCrawl ?? 5,
      requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs ?? 120,
      navigationTimeoutSecs: config.navigationTimeoutSecs ?? 60,
      ...config,
    };
  }

  /**
   * Log with platform prefix for easy filtering
   */
  log(message, level = 'info') {
    const prefix = `[${this.platformName.toUpperCase()}]`;
    switch (level) {
      case 'error':
        log.error(`${prefix} ${message}`);
        break;
      case 'warn':
        log.warning(`${prefix} ${message}`);
        break;
      case 'debug':
        log.debug(`${prefix} ${message}`);
        break;
      default:
        log.info(`${prefix} ${message}`);
    }
  }

  /**
   * Build the search URL for the platform. Override in subclass.
   * @param {string} searchTerm
   * @returns {string} Full URL to scrape
   */
  buildSearchUrl(searchTerm) {
    throw new Error(`${this.platformName}: buildSearchUrl() must be implemented`);
  }

  /**
   * Extract items from the page. Override in subclass.
   * Called inside the Playwright request handler with access to the page.
   * @param {import('playwright').Page} page
   * @param {string} searchTerm
   * @returns {Promise<Array>} Array of extracted item objects
   */
  async extractItems(page, searchTerm) {
    throw new Error(`${this.platformName}: extractItems() must be implemented`);
  }

  /**
   * Log the page structure for debugging.
   * Full dump only when LOG_VERBOSE=true; otherwise logs title + URL only.
   */
  async logPageStructure(page, url) {
    const title = await page.title();
    const currentUrl = page.url();
    this.log(`📄 Page: "${title}" | URL: ${currentUrl}`);

    if (!VERBOSE) return; // Skip heavy DOM analysis in normal server mode

    this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.log(`📄 PAGE STRUCTURE ANALYSIS for: ${url}`);
    this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Body text preview for anti-bot detection
    // 3. Check for common anti-bot / captcha indicators
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
    this.log(`📝 Body text (first 500 chars): ${bodyText.replace(/\n/g, ' ').substring(0, 500)}`);

    // 4. Key meta tags
    const metaInfo = await page.evaluate(() => {
      const metas = {};
      document.querySelectorAll('meta').forEach(m => {
        const name = m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv');
        if (name) metas[name] = (m.getAttribute('content') || '').substring(0, 100);
      });
      return metas;
    });
    this.log(`🏷️  Meta tags: ${JSON.stringify(metaInfo, null, 2)}`);

    // 5. Count key elements
    const elementCounts = await page.evaluate(() => {
      return {
        links: document.querySelectorAll('a').length,
        images: document.querySelectorAll('img').length,
        articles: document.querySelectorAll('article').length,
        divs: document.querySelectorAll('div').length,
        sections: document.querySelectorAll('section').length,
        lists: document.querySelectorAll('ul, ol').length,
        listItems: document.querySelectorAll('li').length,
        forms: document.querySelectorAll('form').length,
        scripts: document.querySelectorAll('script').length,
        iframes: document.querySelectorAll('iframe').length,
      };
    });
    this.log(`📊 Element counts: ${JSON.stringify(elementCounts)}`);

    // 6. All unique tag names on page
    const allTags = await page.evaluate(() => {
      const tags = new Set();
      document.querySelectorAll('*').forEach(el => tags.add(el.tagName.toLowerCase()));
      return [...tags].sort();
    });
    this.log(`🏗️  All HTML tags used: ${allTags.join(', ')}`);

    // 7. Classes and IDs that might contain product/item keywords
    const productSelectors = await page.evaluate(() => {
      const relevant = [];
      const keywords = ['product', 'item', 'card', 'listing', 'result', 'offer', 'ad-', 'annonce', 'article', 'lote', 'anuncio'];
      document.querySelectorAll('[class], [id]').forEach(el => {
        const cls = el.className?.toString() || '';
        const id = el.id || '';
        const combined = `${cls} ${id}`.toLowerCase();
        for (const kw of keywords) {
          if (combined.includes(kw)) {
            relevant.push({
              tag: el.tagName.toLowerCase(),
              class: cls.substring(0, 150),
              id: id.substring(0, 80),
              childCount: el.children.length,
              textPreview: el.innerText?.substring(0, 80)?.replace(/\n/g, ' ') || '',
            });
            break;
          }
        }
      });
      return relevant.slice(0, 30); // Limit to first 30
    });
    this.log(`🔍 Product/Item related elements (${productSelectors.length} found):`);
    productSelectors.forEach((sel, i) => {
      this.log(`   [${i}] <${sel.tag}> class="${sel.class}" id="${sel.id}" children=${sel.childCount}`);
      if (sel.textPreview) this.log(`       text: "${sel.textPreview}"`);
    });

    // 8. Data attributes that might be useful
    const dataAttrs = await page.evaluate(() => {
      const attrs = new Set();
      document.querySelectorAll('*').forEach(el => {
        [...el.attributes].forEach(attr => {
          if (attr.name.startsWith('data-')) {
            attrs.add(`${el.tagName.toLowerCase()}[${attr.name}]`);
          }
        });
      });
      return [...attrs].sort().slice(0, 50);
    });
    this.log(`📋 Data attributes found: ${dataAttrs.join(', ')}`);

    // 9. JSON-LD structured data (often has product info)
    const jsonLd = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return [...scripts].map(s => {
        try { return JSON.parse(s.textContent); } catch { return s.textContent?.substring(0, 200); }
      });
    });
    if (jsonLd.length > 0) {
      this.log(`📦 JSON-LD structured data found (${jsonLd.length} blocks):`);
      jsonLd.forEach((ld, i) => {
        this.log(`   [${i}]: ${JSON.stringify(ld).substring(0, 500)}`);
      });
    }

    // 10. Check for __NEXT_DATA__ or similar hydration data
    const hydrationData = await page.evaluate(() => {
      const result = {};
      if (window.__NEXT_DATA__) result.__NEXT_DATA__ = JSON.stringify(window.__NEXT_DATA__).substring(0, 1000);
      if (window.__NUXT__) result.__NUXT__ = JSON.stringify(window.__NUXT__).substring(0, 1000);
      if (window.__INITIAL_STATE__) result.__INITIAL_STATE__ = JSON.stringify(window.__INITIAL_STATE__).substring(0, 1000);

      // Check for any global variable with 'data' or 'state' in name
      const globals = Object.keys(window).filter(k => 
        (k.includes('data') || k.includes('state') || k.includes('config') || k.includes('props')) 
        && typeof window[k] === 'object' && window[k] !== null
        && !['localStorage', 'sessionStorage'].includes(k)
      );
      if (globals.length > 0) result._interestingGlobals = globals.slice(0, 10);

      return result;
    });
    if (Object.keys(hydrationData).length > 0) {
      this.log(`💾 Hydration/SSR data found:`);
      Object.entries(hydrationData).forEach(([key, val]) => {
        this.log(`   ${key}: ${typeof val === 'string' ? val.substring(0, 500) : JSON.stringify(val)}`);
      });
    }

    this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }

  /**
   * Log details about extracted items (compact version to avoid terminal overflow)
   */
  logExtractedItems(items) {
    this.log(`✅ Extracted ${items.length} items`);
    // Show first 3 items in detail (without rawHtml)
    const preview = items.slice(0, 3);
    preview.forEach((item, i) => {
      const { rawHtml, ...clean } = item;
      this.log(`   [${i}] ${JSON.stringify(clean)}`);
    });
    if (items.length > 3) {
      this.log(`   ... and ${items.length - 3} more items`);
    }
  }

  /**
   * Main search method — opens a page in the shared browser and extracts items.
   *
   * Uses BrowserManager's shared Chromium process instead of launching a
   * separate browser per scraper. Each call gets its own isolated context
   * (like an incognito window) for cookie/storage isolation.
   *
   * @param {string} searchTerm
   * @param {number} page - Page number (1-indexed)
   * @returns {Promise<Array>} Extracted items
   */
  async search(searchTerm, page = 1) {
    this.results = [];
    const url = this.buildSearchUrl(searchTerm, page);
    this.log(`🚀 Starting search for "${searchTerm}" (page ${page})`);
    this.log(`🌐 URL: ${url}`);
    this.log(`⏱️  Timeout: ${SCRAPER_TIMEOUT_MS / 1000}s`);

    let context = null;

    // Hard timeout so one hung platform can't block the entire search.
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout after ${SCRAPER_TIMEOUT_MS / 1000}s`)),
        SCRAPER_TIMEOUT_MS
      )
    );

    const work = async () => {
      // Get an isolated context from the shared browser
      context = await browserManager.newContext({ headless: this.config.headless });
      const browserPage = await context.newPage();

      // Block fonts/video to speed up load (keep images for data extraction)
      await browserPage.route('**/*.{woff,woff2,ttf,eot,mp4,webm}', route => route.abort());

      // Hide automation signals
      await browserPage.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      this.log(`🌍 Navigating to ${url}...`);

      // Navigate — catch timeout so we can still try to extract
      try {
        await browserPage.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: this.config.navigationTimeoutSecs * 1000,
        });
        this.log('✅ DOM loaded — waiting 5s for JS render...');
      } catch (e) {
        this.log(`⚠️  Navigation issue: ${e.message}, continuing anyway...`, 'warn');
      }

      // Wait for JS frameworks to hydrate / render results
      await browserPage.waitForTimeout(5000);
      this.log(`🔎 JS render wait complete — extracting items...`);

      // Log page info (slim unless LOG_VERBOSE=true)
      await this.logPageStructure(browserPage, url);

      // Extract items using platform-specific logic
      try {
        const items = await this.extractItems(browserPage, searchTerm);
        this.results.push(...items);
        this.logExtractedItems(items);
      } catch (error) {
        this.log(`❌ Error extracting items: ${error.message}`, 'error');
        this.log(`Stack: ${error.stack}`, 'error');
      }
    };

    try {
      this.log(`🏃 Scraping (hard limit: ${SCRAPER_TIMEOUT_MS / 1000}s)...`);
      await Promise.race([work(), timeoutPromise]);
    } catch (error) {
      this.log(`❌ Scraper stopped: ${error.message}`, 'error');
    } finally {
      // Always close the context to free memory, even on timeout/error
      if (context) {
        await browserManager.closeContext(context);
      }
    }

    this.log(`🏁 Done — ${this.results.length} items found.`);
    return this.results;
  }
}

export default BaseScraper;
