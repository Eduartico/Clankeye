import BaseScraper from '../BaseScraper.js';
import { chromium } from 'playwright';

const VINTED_TIMEOUT_MS = parseInt(process.env.SCRAPER_TIMEOUT_SECS || '120', 10) * 1000;

/**
 * Vinted scraper — bypasses Cloudflare by:
 * 1. Launching a real Playwright browser (no Crawlee wrapper)
 * 2. Navigating to the homepage to acquire session cookies
 * 3. Calling Vinted's internal REST API via page.evaluate(fetch),
 *    which inherits the browser's cookies and looks like a legitimate XHR.
 */
class VintedScraper extends BaseScraper {
  constructor(config = {}) {
    super('vinted', config);
    this.domain = config.domain || 'https://www.vinted.fr';
  }

  buildSearchUrl(searchTerm, page = 1) {
    // Kept for interface compatibility — actual navigation is in search()
    let url = `${this.domain}/catalog?search_text=${encodeURIComponent(searchTerm)}`;
    if (page > 1) url += `&page=${page}`;
    return url;
  }

  /**
   * Override BaseScraper.search() entirely.
   * Opens a real browser, visits the homepage (to get session cookies),
   * then calls the Vinted catalog API as an in-page fetch — same as the real site does.
   */
  async search(searchTerm, page = 1) {
    this.results = [];
    this.log(`Starting search for "${searchTerm}" (page ${page})`);
    this.log(`Timeout: ${VINTED_TIMEOUT_MS / 1000}s`);

    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const killTimer = setTimeout(() => {
      this.log('Hard timeout — closing browser', 'warn');
      browser.close().catch(() => {});
    }, VINTED_TIMEOUT_MS);

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        locale: 'fr-FR',
        viewport: { width: 1280, height: 800 },
        extraHTTPHeaders: { 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' },
      });

      const browserPage = await context.newPage();

      // Hide automation signals
      await browserPage.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        window.chrome = { runtime: {} };
      });

      // Step 1: Visit homepage to pick up session cookies
      this.log('Visiting homepage for session cookies...');
      await browserPage.goto(this.domain, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await browserPage.waitForTimeout(2000);

      // Accept GDPR/cookie banner if present
      try {
        const cookieBtn = await browserPage.$('[data-testid="cookie-consent-accept-button"], #onetrust-accept-btn-handler');
        if (cookieBtn) {
          await cookieBtn.click();
          this.log('Accepted cookie consent');
          await browserPage.waitForTimeout(1000);
        }
      } catch (_) {}

      // Step 2: Call the Vinted catalog API from inside the browser
      // This request carries the same cookies as a real user's XHR
      const apiUrl = `${this.domain}/api/v2/catalog/items?search_text=${encodeURIComponent(searchTerm)}&per_page=96&page=${page}&order=relevance_score`;
      this.log(`Calling API: ${apiUrl}`);

      const data = await browserPage.evaluate(async (url) => {
        try {
          const res = await fetch(url, {
            credentials: 'include',
            headers: {
              Accept: 'application/json, text/plain, */*',
              'X-Requested-With': 'XMLHttpRequest',
            },
          });
          if (!res.ok) return { _error: res.status };
          return res.json();
        } catch (e) {
          return { _error: e.message };
        }
      }, apiUrl);

      if (data && data._error) {
        this.log(`API error: ${data._error}`, 'warn');
      } else if (data && Array.isArray(data.items)) {
        this.log(`API returned ${data.items.length} items`);
        this.results = data.items
          .filter(item => item.title)
          .map(item => ({
            title: item.title || '',
            price: item.price_numeric
              ? `${item.price_numeric} ${item.currency || 'EUR'}`
              : (item.price && item.price.amount
                ? `${item.price.amount} ${item.price.currency_code || 'EUR'}`
                : ''),
            url: item.url
              ? (item.url.startsWith('http') ? item.url : `${this.domain}${item.url}`)
              : `${this.domain}/items/${item.id}`,
            image: (item.photos && item.photos[0])
              ? (item.photos[0].url || item.photos[0].full_size_url || '')
              : '',
            brand: item.brand_title || '',
            size: item.size_title || '',
          }));

        // Log first 3 as preview
        this.results.slice(0, 3).forEach((item, i) => {
          const { image, ...preview } = item;
          this.log(`   [${i}] ${JSON.stringify(preview)}`);
        });
        if (this.results.length > 3) this.log(`   ... and ${this.results.length - 3} more items`);
      } else {
        this.log(`Unexpected API response shape: ${JSON.stringify(data).substring(0, 200)}`, 'warn');
      }
    } catch (error) {
      this.log(`Crawler stopped: ${error.message}`, 'error');
    } finally {
      clearTimeout(killTimer);
      await browser.close().catch(() => {});
    }

    this.log(`Done — ${this.results.length} items found.`);
    return this.results;
  }

  // extractItems is not used — search() is fully overridden above
  async extractItems(page, searchTerm) {
    return [];
  }
}

export default VintedScraper;
