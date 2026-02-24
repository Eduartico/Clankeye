import { chromium } from 'playwright';
import { log } from 'crawlee';

/**
 * 🧠 BrowserManager — Singleton shared Chromium instance for all scrapers.
 *
 * THE PROBLEM:
 *   Each PlaywrightCrawler (or chromium.launch()) creates its own Chromium
 *   process, each consuming 200-300 MB. With 8 scrapers that's ~2.4 GB → crash.
 *
 * THE FIX:
 *   All scrapers share ONE Chromium process via isolated browser contexts.
 *   A browser context is like an incognito window — separate cookies, storage,
 *   and cache — so scrapers can't interfere with each other.
 *
 *   Memory: ~300 MB total instead of ~2.4 GB.  All 8 run in parallel.
 */

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-blink-features=AutomationControlled',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--no-first-run',
  '--disable-background-networking',
  '--disable-default-apps',
  '--disable-sync',
  '--disable-backgrounding-occluded-windows',
  '--renderer-process-limit=4',       // Cap renderer sub-processes
  '--disable-features=TranslateUI',   // Don't offer translations
];

class BrowserManager {
  constructor() {
    /** @type {import('playwright').Browser | null} */
    this.browser = null;
    this.activeContexts = 0;
    /** @type {Promise<import('playwright').Browser> | null} */
    this._launching = null;
  }

  /**
   * Get (or launch) the shared browser. Safe to call from many scrapers at once
   * — only one launch will ever happen thanks to the _launching promise guard.
   */
  async getBrowser(headless = true) {
    if (this.browser?.isConnected()) return this.browser;

    // If a launch is already in flight, piggy-back on it
    if (this._launching) return this._launching;

    this._launching = (async () => {
      log.info('[BrowserManager] 🚀 Launching shared Chromium…');
      const browser = await chromium.launch({ headless, args: BROWSER_ARGS });
      browser.on('disconnected', () => {
        log.info('[BrowserManager] ⚠️  Browser disconnected unexpectedly.');
        this.browser = null;
        this._launching = null;
      });
      log.info('[BrowserManager] ✅ Shared browser ready.');
      return browser;
    })();

    try {
      this.browser = await this._launching;
      return this.browser;
    } finally {
      this._launching = null;
    }
  }

  /**
   * Create an isolated browser context (like an incognito window).
   * Each scraper gets its own context — cookies & storage are fully isolated.
   *
   * @param {object} [options] - Playwright BrowserContext options (merged with defaults)
   * @returns {Promise<import('playwright').BrowserContext>}
   */
  async newContext(options = {}) {
    const { headless, ...contextOpts } = options;
    const browser = await this.getBrowser(headless ?? true);
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      ...contextOpts,
    });
    this.activeContexts++;
    return context;
  }

  /**
   * Close a context and update the counter.
   * Safe to call multiple times on the same context.
   */
  async closeContext(context) {
    try { await context.close(); } catch { /* already closed */ }
    this.activeContexts = Math.max(0, this.activeContexts - 1);
  }

  /**
   * Shut down the shared browser completely.
   * Call after a batch of scrapes is done (CLI scripts) or on process exit.
   */
  async shutdown() {
    if (this.browser) {
      log.info(`[BrowserManager] 🛑 Shutting down shared browser (${this.activeContexts} contexts active)…`);
      try { await this.browser.close(); } catch { /* ignore */ }
      this.browser = null;
      this._launching = null;
      this.activeContexts = 0;
      log.info('[BrowserManager] ✅ Browser closed.');
    }
  }
}

// ── Singleton ──
export const browserManager = new BrowserManager();
export default browserManager;
