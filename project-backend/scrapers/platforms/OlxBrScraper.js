import BaseScraper from '../BaseScraper.js';

/**
 * OLX Brasil scraper using Crawlee + Playwright
 * Search URL pattern: https://www.olx.com.br/items?q={searchTerm}
 *
 * Filters out promoted/sponsored ads and non-product entries.
 */
class OlxBrScraper extends BaseScraper {
  constructor(config = {}) {
    super('olx-br', config);
  }

  buildSearchUrl(searchTerm, page = 1) {
    let url = `https://www.olx.com.br/items?q=${encodeURIComponent(searchTerm)}`;
    if (page > 1) url += `&o=${page}`;
    return url;
  }

  async extractItems(page, searchTerm) {
    this.log('🔎 Looking for OLX BR listing elements...');

    // Wait for known listing containers
    try {
      await page.waitForSelector(
        '[data-ds-component="DS-NewAdCard-horizontal"], [data-ds-component="DS-NewAdCard"], #ad-list, a[data-lurker-detail], section li a, [class*="adCard"], [class*="listing"]',
        { timeout: 15000 }
      );
      this.log('✅ Found listing container');
    } catch (e) {
      this.log('⚠️ Could not find listing container, proceeding anyway...', 'warn');
    }

    // Log candidate selectors for debugging
    const containers = await page.evaluate(() => {
      const candidates = [
        '[data-ds-component="DS-NewAdCard-horizontal"]',
        '[data-ds-component="DS-NewAdCard"]',
        '#ad-list li',
        '#ad-list > li',
        'a[data-lurker-detail]',
        '.olx-ad-card',
        '[class*="AdCard"]',
        '[class*="adCard"]',
        '[class*="ad-card"]',
        '[class*="listing"]',
        'section ul li',
        '[data-cy="l-card"]',
        'article',
        'a[href*="/item/"]',
        'a[href*="/d/"]',
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
    });

    const items = await page.evaluate(() => {
      const results = [];

      // Only filter truly sponsored entries (very conservative)
      const SKIP_HREF = /google\.|doubleclick|facebook\.com|analytics|login|cadastro|conta\/|ajuda\//i;

      // Try selectors from most specific to most generic
      let cards = document.querySelectorAll('[data-ds-component="DS-NewAdCard-horizontal"]');
      if (cards.length === 0) cards = document.querySelectorAll('[data-ds-component="DS-NewAdCard"]');
      if (cards.length === 0) cards = document.querySelectorAll('a[data-lurker-detail]');
      if (cards.length === 0) cards = document.querySelectorAll('#ad-list > li');
      if (cards.length === 0) cards = document.querySelectorAll('#ad-list li');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="olx-ad-card"]');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="AdCard"]');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="adCard"]');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="ad-card"]');
      if (cards.length === 0) cards = document.querySelectorAll('[data-cy="l-card"]');
      if (cards.length === 0) cards = document.querySelectorAll('section ul li');
      if (cards.length === 0) cards = document.querySelectorAll('article');

      // Super-generic last resort: find all links that look like OLX item pages
      if (cards.length === 0) {
        const allLinks = document.querySelectorAll('a[href*="olx.com.br"]');
        const itemLinks = [...allLinks].filter(a => {
          const h = a.href || '';
          return (h.includes('/item/') || h.includes('/d/')) && !SKIP_HREF.test(h);
        });
        // Wrap each link in an array-like for the processing below
        cards = itemLinks;
      }

      cards.forEach(card => {
        try {
          // Skip if explicitly sponsored
          if (card.querySelector('[data-lurker_position="sponsored"]')) return;
          if (card.getAttribute('data-lurker_position') === 'sponsored') return;
          if (card.closest('[data-lurker_position="sponsored"]')) return;

          const link = card.querySelector('a[href*="olx.com.br"]') || card.querySelector('a') || card.closest('a') || card;
          const href = link?.href || '';

          // Must have a link, must be OLX
          if (!href) return;
          if (SKIP_HREF.test(href)) return;

          // Find title from heading elements or data-component text
          const titleEl = card.querySelector('h2, h3, h4, h5, h6, [data-ds-component="DS-Text"]');
          let title = titleEl?.innerText?.trim() || '';

          // If no heading found, try the card's direct text content (for link-based cards)
          if (!title && card.tagName === 'A') {
            title = card.innerText?.split('\n')[0]?.trim() || '';
          }

          // Must have some title
          if (!title || title.length < 2) return;

          // Price extraction — multiple strategies
          const priceEl = card.querySelector(
            '[data-ds-component="DS-Text"][color="gray-600"], ' +
            'span[aria-label*="preço"], ' +
            'span[aria-label*="R\\$"], ' +
            '.price, ' +
            '[class*="price"], ' +
            '[class*="Price"]'
          );
          let price = priceEl?.innerText?.trim() || '';
          if (!price) {
            const cardText = card.innerText || '';
            const priceMatch = cardText.match(/R\$\s*[\d.,]+/);
            if (priceMatch) price = priceMatch[0];
          }

          const imgEl = card.querySelector('img');
          const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';

          const locationEl = card.querySelector(
            'span[aria-label*="local"], ' +
            '.location, ' +
            '[class*="location"], ' +
            '[class*="Location"]'
          );
          const location = locationEl?.innerText?.trim() || '';

          const dateEl = card.querySelector(
            '[class*="date"], [class*="Date"], [class*="time"], [class*="Time"], ' +
            'span[aria-label*="data"]'
          );
          const date = dateEl?.innerText?.trim() || '';

          results.push({
            title,
            price,
            url: href,
            image,
            location,
            date,
          });
        } catch (e) { /* skip */ }
      });

      return results;
    });

    // If nothing found, log page content for debugging
    if (items.length === 0) {
      const bodySnippet = await page.evaluate(() => document.body?.innerText?.substring(0, 1500) || '');
      this.log(`⚠️ No items extracted. Body text: ${bodySnippet.replace(/\n/g, ' ').substring(0, 800)}`, 'warn');
      const pageUrl = page.url();
      this.log(`⚠️ Current page URL: ${pageUrl}`, 'warn');
    }

    this.log(`✅ Extracted ${items.length} items (after filtering)`);
    if (items.length > 0) {
      items.slice(0, 3).forEach((item, i) => {
        const { rawHtml, ...clean } = item;
        this.log(`   [${i}] ${JSON.stringify(clean)}`);
      });
      if (items.length > 3) this.log(`   ... and ${items.length - 3} more items`);
    }
    return items;
  }
}

export default OlxBrScraper;
