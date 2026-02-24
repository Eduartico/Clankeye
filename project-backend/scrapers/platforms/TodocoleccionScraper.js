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
    // Todocoleccion uses /buscador with bu= for search term, O=r for sort by recent, P= for page
    const encoded = encodeURIComponent(searchTerm);
    let url = `https://www.todocoleccion.net/buscador?bu=${encoded}&O=r`;
    if (page > 1) url += `&P=${page}`;
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
        const imgEls = card.querySelectorAll('img');
        for (const imgEl of imgEls) {
          const src = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy') || imgEl.getAttribute('data-original') || imgEl.getAttribute('data-lazy-src') || imgEl.getAttribute('data-img') || '';
          const srcset = imgEl.getAttribute('srcset') || imgEl.getAttribute('data-srcset') || '';
          if (srcset) {
            const parts = srcset.split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
            if (parts.length > 0) return parts[parts.length - 1];
          }
          if (src && !src.includes('data:image') && !src.includes('placeholder') && !src.includes('spacer') && src.length > 10) return src;
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

      // Try multiple selectors - todocoleccion uses .lote for items
      let cards = document.querySelectorAll('.lote');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="lote"]');
      if (cards.length === 0) cards = document.querySelectorAll('.product-card');
      if (cards.length === 0) cards = document.querySelectorAll('article');
      if (cards.length === 0) cards = document.querySelectorAll('a[href*="/lote/"]');
      // Fallback: find any link that looks like a todocoleccion item page
      if (cards.length === 0) {
        const allLinks = document.querySelectorAll('a[href*="todocoleccion.net"]');
        cards = [...allLinks].filter(a => {
          const h = a.href || '';
          return h.includes('/lote/') || h.includes('/item/') || /\/\d{5,}/.test(h);
        });
      }

      cards.forEach(card => {
        try {
          const link = card.querySelector('a') || card.closest('a') || card;
          const titleEl = card.querySelector('.title, h3, h4, .lote-title, [class*="title"], [class*="nombre"]');
          const priceEl = card.querySelector('.price, .lote-price, [class*="price"], [class*="precio"], .puja');
          const bidEl = card.querySelector('.bid, .puja-actual, [class*="bid"], [class*="puja"]');
          const timeEl = card.querySelector('.time, .tiempo, [class*="time"], [class*="tiempo"], [class*="fecha"]');
          const image = extractImage(card);

          let title = titleEl?.innerText?.trim() || '';
          // If no specific title element, try the link text
          if (!title) {
            title = link?.innerText?.trim()?.split('\n')[0]?.trim() || '';
          }
          // Must have a meaningful title (not just discount labels, time stamps, etc.)
          if (!title || title.length < 3) return;
          // Skip overlay/badge text: discount labels, time-remaining strings, price-only
          if (/^-?\d+%$/.test(title)) return;                        // "-50%", "30%"
          if (/^\d+[dhms]\s*\d*[dhms]?$/i.test(title)) return;       // "4d 3h", "5d 8h"
          if (/^(envío|envio|shipping|gratis|free)$/i.test(title)) return;
          if (/^\d+[.,]?\d*\s*€?$/.test(title)) return;              // just a price
          // Skip recommendation/promo text that leaks into results
          if (/echa un vistazo/i.test(title)) return;
          if (/últimos lotes/i.test(title)) return;
          if (/has mostrado interés/i.test(title)) return;
          if (/te puede interesar/i.test(title)) return;
          if (/recomendados para ti/i.test(title)) return;
          if (/lotes similares/i.test(title)) return;

          const url = link?.href || '';
          // Must be a valid todocoleccion URL (skip items without URL)
          if (!url) return;
          if (url && !url.includes('todocoleccion.net') && !url.startsWith('/')) return;

          results.push({
            title,
            price: priceEl?.innerText?.trim() || '',
            url: url.startsWith('/') ? `https://www.todocoleccion.net${url}` : url,
            image,
            currentBid: bidEl?.innerText?.trim() || '',
            timeRemaining: timeEl?.innerText?.trim() || '',
            date: timeEl?.innerText?.trim() || '',
            source: 'todocoleccion',
          });
        } catch (e) { /* skip */ }
      });

      return results;
    });

    // Deduplicate by URL (todocoleccion sometimes renders same item multiple times)
    const seen = new Set();
    const deduped = items.filter(item => {
      if (!item.url || seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });

    return deduped;
  }
}

export default TodocoleccionScraper;
