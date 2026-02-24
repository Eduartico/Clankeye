import BaseScraper from '../BaseScraper.js';

/**
 * eBay scraper using Crawlee + Playwright
 * Search URL pattern: https://www.ebay.com/sch/i.html?_nkw={searchTerm}
 */
class EbayScraper extends BaseScraper {
  constructor(config = {}) {
    super('ebay', config);
    this.domain = config.domain || 'https://www.ebay.com';
  }

  buildSearchUrl(searchTerm, page = 1) {
    // _sop=10 sorts by "Newly listed" (most recent first)
    let url = `${this.domain}/sch/i.html?_nkw=${encodeURIComponent(searchTerm)}&_sacat=0&_from=R40&_sop=10`;
    if (page > 1) url += `&_pgn=${page}`;
    return url;
  }

  async extractItems(page, searchTerm) {
    this.log('🔎 Looking for eBay listing elements...');

    // eBay is more traditional, wait for results
    try {
      await page.waitForSelector('.srp-results, #srp-river-results, .s-item, .s-card', { timeout: 15000 });
      this.log('✅ Found eBay results container');
    } catch (e) {
      this.log('⚠️ Could not find eBay results container, proceeding anyway...', 'warn');
    }

    const containers = await page.evaluate(() => {
      const candidates = [
        '.s-item',
        '.s-card',
        'li.s-card',
        'li[data-listingid]',
        '[data-viewport]',
        'ul.srp-results li',
        '.su-card-container',
        'li.s-card--vertical',
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

    const items = await page.evaluate(() => {
      const results = [];
      
      // Try new eBay layout first (s-card), then fallback to legacy (s-item)
      let cards = document.querySelectorAll('li.s-card[data-listingid]');
      if (cards.length === 0) cards = document.querySelectorAll('li[data-viewport].s-card');
      if (cards.length === 0) cards = document.querySelectorAll('.s-item');

      cards.forEach(card => {
        try {
          // New eBay layout uses s-card
          const link = card.querySelector('a.s-card__link') || card.querySelector('a[href*="/itm/"]') || card.querySelector('a');
          const titleEl = card.querySelector('.s-card__title span[role="heading"]') 
            || card.querySelector('.s-card__title') 
            || card.querySelector('.s-item__title span');
          let title = titleEl?.innerText?.trim() || '';
          
          // Clean title: remove trailing translated UI text like "Abre em janela ou guia separada",
          // "Opens in a new window or tab", etc.
          const uiTextPatterns = [
            /\s*(Abre em janela ou guia separada|Opens in a new window or tab|Ouvre dans une nouvelle fenêtre ou un nouvel onglet|Se abre en una nueva ventana o pestaña|Öffnet in einem neuen Fenster oder Tab|Apre in una nuova finestra o scheda|Otwiera się w nowym oknie lub karcie)\s*$/i,
            /\s*Brand New\s*$/i,
            /\s*Pre-Owned\s*$/i,
          ];
          for (const pattern of uiTextPatterns) {
            title = title.replace(pattern, '').trim();
          }
          
          // Skip placeholder items
          if (!title || title.toLowerCase().includes('shop on ebay') || title.toLowerCase().includes('resultados correspondentes')) return;

          const priceEl = card.querySelector('.s-card__price span') 
            || card.querySelector('.s-card__price') 
            || card.querySelector('.s-item__price');
          const imgEl = card.querySelector('img');
          const conditionEl = card.querySelector('.s-card__subtitle span') 
            || card.querySelector('.SECONDARY_INFO');
          const shippingEl = card.querySelector('.s-card__shipping, .s-item__shipping');
          const locationEl = card.querySelector('.s-card__location, .s-item__location, .s-item__itemLocation');
          const listingId = card.getAttribute('data-listingid') || '';

          // Extract date — eBay shows listing dates in various formats
          const dateEl = card.querySelector('.s-card__listingDate, .s-item__listingDate, [class*="listingDate"], [class*="endDate"]');
          const date = dateEl?.innerText?.trim() || '';

          results.push({
            title,
            price: priceEl?.innerText?.trim() || '',
            url: link?.href || '',
            image: imgEl?.src || imgEl?.getAttribute('data-src') || '',
            condition: conditionEl?.innerText?.trim() || '',
            shipping: shippingEl?.innerText?.trim() || '',
            location: locationEl?.innerText?.trim() || '',
            date,
            listingId,
            source: 'ebay',
          });
        } catch (e) { /* skip */ }
      });

      return results;
    });

    return items;
  }
}

export default EbayScraper;
