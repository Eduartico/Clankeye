import BaseScraper from '../BaseScraper.js';

/**
 * OLX Poland scraper using Crawlee + Playwright
 * Search URL pattern: https://www.olx.pl/oferty/q-{searchTerm}/
 */
class OlxPlScraper extends BaseScraper {
  constructor(config = {}) {
    super('olx-pl', config);
  }

  buildSearchUrl(searchTerm, page = 1) {
    const encoded = encodeURIComponent(searchTerm).replace(/%20/g, '-');
    let url = `https://www.olx.pl/oferty/q-${encoded}/`;
    // Add sort by most recent and pagination
    const params = [];
    if (page > 1) params.push(`page=${page}`);
    params.push('search%5Border%5D=created_at%3Adesc');
    if (params.length > 0) url += `?${params.join('&')}`;
    return url;
  }

  async extractItems(page, searchTerm) {
    this.log('🔎 Looking for OLX PL listing elements...');

    // Scroll incrementally to the page bottom to trigger lazy-loading of ALL card
    // images — not just the first viewport-worth (~20 items). Each step waits a
    // bit so the browser can decode and display newly revealed images.
    await page.evaluate(async () => {
      const STEP = 600;
      const DELAY = 200;
      let currentPos = 0;
      while (currentPos < document.body.scrollHeight) {
        window.scrollTo(0, currentPos);
        await new Promise(r => setTimeout(r, DELAY));
        currentPos += STEP;
      }
      // Final scroll to actual bottom (handles dynamic height growth)
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 300));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);

    const containers = await page.evaluate(() => {
      const candidates = [
        '[data-cy="l-card"]',
        '[data-testid="listing-grid"] > div',
        '.css-1sw7q4x',
        'article',
        'div[data-cy]',
        'a[href*="/oferta/"]',
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
      this.log(`   First HTML: ${info.firstHtml}`);
    });

    const items = await page.evaluate(() => {
      const results = [];

      function extractImage(card) {
        // Skip known OLX placeholder / no-thumbnail images
        const SKIP_IMG = /no_thumbnail|placeholder|spacer\.gif|data:image|static\/media\/no_/i;

        // Try all img elements within the card
        const imgEls = card.querySelectorAll('img');
        for (const imgEl of imgEls) {
          const srcset = imgEl.getAttribute('srcset') || imgEl.getAttribute('data-srcset') || '';
          if (srcset) {
            const parts = srcset.split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
            const best = parts[parts.length - 1];
            if (best && !SKIP_IMG.test(best)) return best;
          }
          const src = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy') || imgEl.getAttribute('data-original') || imgEl.getAttribute('data-lazy-src') || imgEl.getAttribute('data-preload') || '';
          if (src && !SKIP_IMG.test(src) && src.length > 10) return src;
        }
        const picture = card.querySelector('picture source');
        if (picture) {
          const srcset = picture.getAttribute('srcset') || '';
          if (srcset) {
            const url = srcset.split(',')[0].trim().split(/\s+/)[0];
            if (url && !SKIP_IMG.test(url)) return url;
          }
        }
        const bgEl = card.querySelector('[style*="background-image"]');
        if (bgEl) {
          const match = bgEl.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
          if (match && !SKIP_IMG.test(match[1])) return match[1];
        }
        return '';
      }

      let cards = document.querySelectorAll('[data-cy="l-card"]');
      if (cards.length === 0) cards = document.querySelectorAll('article');
      if (cards.length === 0) cards = document.querySelectorAll('a[href*="/oferta/"]');

      cards.forEach(card => {
        try {
          const link = card.querySelector('a') || card.closest('a') || card;
          const titleEl = card.querySelector('h6, h4, h3, [data-cy="ad-title"]');
          const priceEl = card.querySelector('[data-testid="ad-price"], .price, p[data-testid]');
          const locationEl = card.querySelector('[data-testid="location-date"], small, span');
          const image = extractImage(card);

          const title = titleEl?.innerText?.trim() || link?.innerText?.substring(0, 100)?.trim() || '';
          if (!title) return;

          // Extract date from location-date element
          let date = '';
          const locText = locationEl?.innerText?.trim() || '';
          // Try to extract date portion after the dash separator
          const dashParts = locText.split(/\s*[-–—]\s*/);
          if (dashParts.length >= 2) {
            const datePart = dashParts[dashParts.length - 1].trim();
            if (datePart) date = datePart;
          }
          // Fallback: regex match for common patterns
          if (!date) {
            const dateMatch = locText.match(/(Dzisiaj\s*(?:o\s*\d{1,2}:\d{2})?|Wczoraj\s*(?:o\s*\d{1,2}:\d{2})?|Today|Yesterday|\d{1,2}\s+\w{3}\.?\s+\d{4}|\d{1,2}\s+\w{3}\.?(?:\s+\d{2}:\d{2})?)/i);
            if (dateMatch) date = dateMatch[1];
          }

          results.push({
            title,
            price: priceEl?.innerText?.trim() || '',
            url: link?.href || '',
            image,
            location: locText,
            date,
            source: 'olx-pl',
          });
        } catch (e) { /* skip */ }
      });

      return results;
    });

    return items;
  }
}

export default OlxPlScraper;
