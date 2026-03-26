import BaseScraper from '../BaseScraper.js';
import browserManager from '../BrowserManager.js';

const WALLAPOP_TIMEOUT_MS = parseInt(process.env.SCRAPER_TIMEOUT_SECS || '120', 10) * 1000;

/**
 * Wallapop scraper using Crawlee + Playwright
 * Search URL pattern: https://pt.wallapop.com/search?keywords={searchTerm}&order_by=newest
 *
 * Wallapop uses infinite scroll — pagination is achieved by scrolling down
 * multiple times to trigger lazy-loading of additional results.
 * Page 1 = initial load, Page 2 = scroll 3 more times, Page 3 = scroll 6 times, etc.
 */
const SCROLLS_PER_PAGE = 6;
const SCROLL_PAUSE_MS = 1500;

class WallapopScraper extends BaseScraper {
  constructor(config = {}) {
    super('wallapop', config);
    this.domain = config.domain || 'https://pt.wallapop.com';
  }

  buildSearchUrl(searchTerm, page = 1) {
    return `${this.domain}/search?keywords=${encodeURIComponent(searchTerm)}&order_by=newest`;
  }

  /**
   * Override BaseScraper.search() to implement scroll-based pagination.
   * For page N, we scroll down (N * SCROLLS_PER_PAGE) times from the top,
   * then extract all visible items. The server-side dedup will filter out
   * items already returned in previous pages.
   */
  async search(searchTerm, page = 1) {
    this.results = [];
    const url = this.buildSearchUrl(searchTerm, page);
    const totalScrolls = page * SCROLLS_PER_PAGE;
    this.log(`🚀 Starting search for "${searchTerm}" (page ${page}, scrolling ${totalScrolls} times)`);
    this.log(`🌐 URL: ${url}`);

    const context = await browserManager.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'es-ES',
      viewport: { width: 1280, height: 800 },
    });

    const killTimer = setTimeout(() => {
      this.log('Hard timeout — closing context', 'warn');
      browserManager.closeContext(context).catch(() => {});
    }, WALLAPOP_TIMEOUT_MS);

    try {
      const browserPage = await context.newPage();

      // Block heavy resources
      await browserPage.route('**/*.{woff,woff2,ttf,eot,mp4,webm}', route => route.abort());
      await browserPage.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      this.log(`🌍 Navigating to ${url}...`);
      try {
        await browserPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        this.log('✅ DOM loaded — waiting for initial render...');
      } catch (e) {
        this.log(`⚠️ Navigation issue: ${e.message}, continuing anyway...`, 'warn');
      }

      // Wait for initial cards to appear
      await browserPage.waitForTimeout(3000);

      // Accept cookie banner if present
      try {
        const cookieBtn = await browserPage.$('#onetrust-accept-btn-handler, [data-testid="cookie-consent-accept-button"]');
        if (cookieBtn) {
          await cookieBtn.click();
          this.log('Accepted cookie consent');
          await browserPage.waitForTimeout(500);
        }
      } catch (_) {}

      // Scroll down to load more results
      for (let i = 0; i < totalScrolls; i++) {
        await browserPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await browserPage.waitForTimeout(SCROLL_PAUSE_MS);
        this.log(`📜 Scroll ${i + 1}/${totalScrolls} complete`);
      }

      // Extract items
      this.log('🔎 Extracting items after scrolling...');
      const items = await this.extractItems(browserPage, searchTerm);
      this.results.push(...items);
      this.logExtractedItems(items);
    } catch (error) {
      this.log(`❌ Scraper stopped: ${error.message}`, 'error');
    } finally {
      clearTimeout(killTimer);
      await browserManager.closeContext(context);
    }

    this.log(`🏁 Done — ${this.results.length} items found.`);
    return this.results;
  }

  async extractItems(page, searchTerm) {
    this.log('🔎 Looking for Wallapop listing elements...');

    // Wallapop is an SPA, need to wait for rendering
    try {
      await page.waitForSelector('tsl-public-item-card, .ItemCardList, [class*="ItemCard"], a[href*="/item/"]', { timeout: 15000 });
      this.log('✅ Found Wallapop item cards');
    } catch (e) {
      this.log('⚠️ Could not find Wallapop item cards, proceeding anyway...', 'warn');
    }

    const containers = await page.evaluate(() => {
      const candidates = [
        'tsl-public-item-card',
        '.ItemCardList__item',
        '.ItemCardList a',
        '[class*="ItemCard"]',
        'a[href*="/item/"]',
        '.card-product',
        'wallapop-card',
        '[data-testid*="item"]',
        'walla-cards-container',
        '.search-results a',
      ];
      
      const found = {};
      for (const sel of candidates) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
          found[sel] = {
            count: els.length,
            firstHtml: els[0].outerHTML.substring(0, 500),
          };
        }
      }
      return found;
    });

    this.log(`📋 Candidate selectors found:`);
    Object.entries(containers).forEach(([sel, info]) => {
      this.log(`   "${sel}" → ${info.count} elements`);
      this.log(`   First HTML: ${info.firstHtml}`);
    });

    // Check for Angular/web component shadow DOM
    const shadowRoots = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const withShadow = [];
      elements.forEach(el => {
        if (el.shadowRoot) {
          withShadow.push({
            tag: el.tagName.toLowerCase(),
            childCount: el.shadowRoot.children.length,
            innerHTML: el.shadowRoot.innerHTML.substring(0, 300),
          });
        }
      });
      return withShadow.slice(0, 10);
    });
    if (shadowRoots.length > 0) {
      this.log(`🔮 Shadow DOM elements found (${shadowRoots.length}):`);
      shadowRoots.forEach((sr, i) => {
        this.log(`   [${i}] <${sr.tag}> children=${sr.childCount}`);
        this.log(`   HTML: ${sr.innerHTML}`);
      });
    }

    const items = await page.evaluate(() => {
      const results = [];
      
      // Wallapop uses web components, try multiple approaches
      let cards = document.querySelectorAll('tsl-public-item-card');
      if (cards.length === 0) cards = document.querySelectorAll('.ItemCardList__item');
      if (cards.length === 0) cards = document.querySelectorAll('a[href*="/item/"]');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="ItemCard"]');

      cards.forEach(card => {
        try {
          const link = card.querySelector('a[href*="/item/"]') || card.closest('a') || card;
          const titleEl = card.querySelector('.ItemCard__title, [class*="title"], h3, h2');
          const priceEl = card.querySelector('.ItemCard__price, [class*="price"]');
          const imgEl = card.querySelector('img');
          const descEl = card.querySelector('.ItemCard__description, [class*="description"]');

          results.push({
            title: titleEl?.innerText?.trim() || '',
            price: priceEl?.innerText?.trim() || '',
            url: link?.href || '',
            image: imgEl?.src || imgEl?.getAttribute('data-src') || '',
            description: descEl?.innerText?.trim() || '',
            source: 'wallapop',
          });
        } catch (e) { /* skip */ }
      });

      return results;
    });

    return items;
  }
}

export default WallapopScraper;
