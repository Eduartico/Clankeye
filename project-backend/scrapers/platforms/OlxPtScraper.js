import BaseScraper from '../BaseScraper.js';

/**
 * OLX Portugal scraper using Crawlee + Playwright
 * Search URL pattern: https://www.olx.pt/ads/q-{searchTerm}/
 */
class OlxPtScraper extends BaseScraper {
  constructor(config = {}) {
    super('olx-pt', config);
  }

  buildSearchUrl(searchTerm, page = 1) {
    const encoded = encodeURIComponent(searchTerm).replace(/%20/g, '-');
    let url = `https://www.olx.pt/ads/q-${encoded}/`;
    if (page > 1) url += `?page=${page}`;
    return url;
  }

  async extractItems(page, searchTerm) {
    this.log('🔎 Looking for OLX PT listing elements...');

    // Log all potential listing containers
    const containers = await page.evaluate(() => {
      const candidates = [
        '[data-cy="l-card"]',
        '.offer-wrapper',
        '.css-1sw7q4x', // OLX dynamic class
        '[data-testid="listing-grid"]',
        '[data-testid="l-card"]',
        'article',
        '.listing-grid-container a',
        'div[data-cy]',
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

    // Try multiple known OLX selectors
    const items = await page.evaluate(() => {
      const results = [];

      function extractImage(card) {
        // Try standard img element with all possible lazy-load attributes
        const imgEl = card.querySelector('img');
        if (imgEl) {
          const src = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy') || imgEl.getAttribute('data-original') || imgEl.getAttribute('data-lazy-src') || '';
          // Check srcset for higher quality
          const srcset = imgEl.getAttribute('srcset') || imgEl.getAttribute('data-srcset') || '';
          if (srcset) {
            const parts = srcset.split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
            if (parts.length > 0) return parts[parts.length - 1]; // highest resolution
          }
          if (src && !src.includes('data:image') && !src.includes('placeholder')) return src;
        }
        // Try <picture> element
        const picture = card.querySelector('picture source');
        if (picture) {
          const srcset = picture.getAttribute('srcset') || '';
          if (srcset) return srcset.split(',')[0].trim().split(/\s+/)[0];
        }
        // Try background-image in style
        const bgEl = card.querySelector('[style*="background-image"]');
        if (bgEl) {
          const match = bgEl.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
          if (match) return match[1];
        }
        return '';
      }

      let cards = document.querySelectorAll('[data-cy="l-card"]');
      if (cards.length === 0) cards = document.querySelectorAll('article');
      if (cards.length === 0) cards = document.querySelectorAll('a[href*="/d/"]');

      cards.forEach(card => {
        try {
          const link = card.querySelector('a') || card.closest('a') || card;
          const titleEl = card.querySelector('h6, h4, h3, [data-cy="ad-title"], .title');
          const priceEl = card.querySelector('[data-testid="ad-price"], .price, p');
          const locationEl = card.querySelector('[data-testid="location-date"], .location, small');
          const image = extractImage(card);

          const title = titleEl?.innerText?.trim() || link?.innerText?.substring(0, 100)?.trim() || '';
          // Skip items without image (OLX doesn't support imageless listings)
          if (!image || !title) return;

          results.push({
            title,
            price: priceEl?.innerText?.trim() || '',
            url: link?.href || '',
            image,
            location: locationEl?.innerText?.trim() || '',
          });
        } catch (e) {
          // skip
        }
      });

      return results;
    });

    return items;
  }
}

export default OlxPtScraper;
