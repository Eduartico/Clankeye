import BaseScraper from '../BaseScraper.js';

/**
 * Wallapop scraper using Crawlee + Playwright
 * Search URL pattern: https://pt.wallapop.com/search?keywords={searchTerm}&order_by=newest
 * Note: Wallapop uses infinite scroll — no page parameter.
 */
class WallapopScraper extends BaseScraper {
  constructor(config = {}) {
    super('wallapop', config);
    this.domain = config.domain || 'https://pt.wallapop.com';
  }

  buildSearchUrl(searchTerm, page = 1) {
    // Wallapop uses infinite scroll — no pagination, order_by=newest for most recent
    const url = `${this.domain}/search?keywords=${encodeURIComponent(searchTerm)}&order_by=newest`;
    // Wallapop has no page parameter (infinite scroll) — always returns first batch
    return url;
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
