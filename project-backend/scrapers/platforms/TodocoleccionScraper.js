import BaseScraper from '../BaseScraper.js';

/**
 * Todo Coleccion (todocoleccion.net) scraper using Crawlee + Playwright
 * Search URL: https://www.todocoleccion.net/buscador?from=top&bu={searchTerm}
 * The search is rendered client-side via JavaScript after page load.
 */
class TodocoleccionScraper extends BaseScraper {
  constructor(config = {}) {
    super('todocoleccion', config);
  }

  buildSearchUrl(searchTerm, page = 1) {
    // Todocoleccion uses /buscador?from=top&bu= for search
    const encoded = searchTerm.replace(/\s+/g, '+');
    let url = `https://www.todocoleccion.net/buscador?from=top&bu=${encoded}`;
    if (page > 1) url += `&pagina=${page}`;
    return url;
  }

  async extractItems(page, searchTerm) {
    this.log('🔎 Looking for Todo Coleccion listing elements...');

    // Accept cookies if banner appears
    try {
      const cookieBtn = await page.$('#CookieScriptConsent button, [id*="cookie"] button, .cookie-accept');
      if (cookieBtn) {
        await cookieBtn.click();
        this.log('🍪 Accepted cookie consent');
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      this.log('🍪 No cookie banner or already accepted');
    }

    // Wait extra time for JS-rendered search results to load
    this.log('⏳ Waiting for JS-rendered search results...');
    await page.waitForTimeout(5000);

    // Wait for the search results to load
    try {
      await page.waitForSelector('.lote, .product-card, .search-results, #results, [class*="lote"], a[href*="todocoleccion.net/"]', { timeout: 15000 });
      this.log('✅ Found Todo Coleccion results container');
    } catch (e) {
      this.log('⚠️ Could not find Todo Coleccion results, proceeding anyway...', 'warn');
    }

    const containers = await page.evaluate(() => {
      const candidates = [
        '.lote',
        '.lotes-list .lote',
        '.product-card',
        'article.lote',
        '[class*="lote"]',
        '.search-result-item',
        '#results li',
        '#results article',
        '.grid-lotes > div',
        'a[href*="/lote/"]',
        'a[href*="todocoleccion.net"]',
        '.mod-lote',
        '.item-lote',
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

      function extractImage(card) {
        const imgEl = card.querySelector('img');
        if (imgEl) {
          const src = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy') || imgEl.getAttribute('data-original') || imgEl.getAttribute('data-lazy-src') || imgEl.getAttribute('data-img') || '';
          const srcset = imgEl.getAttribute('srcset') || imgEl.getAttribute('data-srcset') || '';
          if (srcset) {
            const parts = srcset.split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
            if (parts.length > 0) return parts[parts.length - 1];
          }
          if (src && !src.includes('data:image') && !src.includes('placeholder') && !src.includes('spacer')) return src;
        }
        const picture = card.querySelector('picture source');
        if (picture) {
          const srcset = picture.getAttribute('srcset') || '';
          if (srcset) return srcset.split(',')[0].trim().split(/\s+/)[0];
        }
        const bgEl = card.querySelector('[style*="background-image"]');
        if (bgEl) {
          const match = bgEl.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
          if (match) return match[1];
        }
        // Check data-bg attribute (common lazy-load pattern)
        const dataBgEl = card.querySelector('[data-bg]');
        if (dataBgEl) return dataBgEl.getAttribute('data-bg') || '';
        return '';
      }

      let cards = document.querySelectorAll('.lote');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="lote"]');
      if (cards.length === 0) cards = document.querySelectorAll('article');
      if (cards.length === 0) cards = document.querySelectorAll('a[href*="/lote/"]');

      cards.forEach(card => {
        try {
          const link = card.querySelector('a') || card.closest('a') || card;
          const titleEl = card.querySelector('.title, h3, h4, .lote-title, [class*="title"]');
          const priceEl = card.querySelector('.price, .lote-price, [class*="price"], .puja');
          const bidEl = card.querySelector('.bid, .puja-actual, [class*="bid"]');
          const timeEl = card.querySelector('.time, .tiempo, [class*="time"]');
          const image = extractImage(card);

          const title = titleEl?.innerText?.trim() || '';
          // Skip blank/empty items: must have BOTH title AND image to be a real item
          if (!title || !image) return;

          results.push({
            title,
            price: priceEl?.innerText?.trim() || '',
            url: link?.href || '',
            image,
            currentBid: bidEl?.innerText?.trim() || '',
            timeRemaining: timeEl?.innerText?.trim() || '',
          });
        } catch (e) { /* skip */ }
      });

      return results;
    });

    return items;
  }
}

export default TodocoleccionScraper;
