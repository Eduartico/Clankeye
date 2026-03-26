import BaseScraper from '../BaseScraper.js';

/**
 * OLX Brasil scraper using Crawlee + Playwright
 * OLX BR uses Next.js with __NEXT_DATA__ containing all ad data.
 * We extract from the JSON hydration first, falling back to DOM selectors.
 */
class OlxBrScraper extends BaseScraper {
  constructor(config = {}) {
    super('olx-br', config);
  }

  buildSearchUrl(searchTerm, page = 1) {
    // OLX BR national search — /brasil?q=...
    // search[order]=created_at:desc sorts by most recent
    const encoded = encodeURIComponent(searchTerm);
    let url = `https://www.olx.com.br/brasil?q=${encoded}&search%5Border%5D=created_at%3Adesc`;
    if (page > 1) url += `&o=${page}`;
    return url;
  }

  async extractItems(page, searchTerm) {
    this.log('🔎 Looking for OLX BR listing elements...');

    // Scroll incrementally to the page bottom to trigger lazy-loading of ALL
    // ad cards and images before we try to extract them from the DOM.
    await page.evaluate(async () => {
      const STEP = 600;
      const DELAY = 200;
      let currentPos = 0;
      while (currentPos < document.body.scrollHeight) {
        window.scrollTo(0, currentPos);
        await new Promise(r => setTimeout(r, DELAY));
        currentPos += STEP;
      }
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 300));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);

    // ── Strategy 1: Try __NEXT_DATA__ JSON hydration (most reliable) ──
    const nextDataItems = await page.evaluate((term) => {
      try {
        const script = document.querySelector('#__NEXT_DATA__');
        if (!script) return null;
        const json = JSON.parse(script.textContent);
        const props = json?.props?.pageProps;
        if (!props) return null;

        // Try multiple paths where ads might live (OLX BR has changed structure over time)
        const ads =
          props.ads ||
          props.searchResult?.ads ||
          props.adList ||
          props.listing?.listing ||
          props.listing?.ads ||
          props.initialState?.listing?.data?.ads ||
          props.data?.ads ||
          props.search?.ads ||
          [];
        if (!Array.isArray(ads) || ads.length === 0) {
          // Log available top-level keys so we can update paths if OLX changes structure
          console.log('[OlxBr] __NEXT_DATA__ pageProps keys:', Object.keys(props).join(', '));
          return null;
        }

        return ads.map(ad => {
          // Normalize price to always use "R$" prefix (OLX BR sometimes returns just "$")
          let price = ad.price || ad.priceLabel || (ad.priceValue ? `R$ ${ad.priceValue}` : '');
          if (typeof price === 'string') {
            // Replace bare "$" with "R$" but don't double-prefix "R$"
            price = price.replace(/^(?:R\$?\s*)?(\$\s*)/i, 'R$ ').replace(/^R\s+\$/, 'R$');
            // If it's just digits, add "R$" prefix
            if (/^\d/.test(price)) price = `R$ ${price}`;
          }
          return {
            title: ad.subject || ad.title || '',
            price,
            url: ad.url || (ad.listId ? `https://www.olx.com.br/d/item/${ad.listId}` : ''),
            image: ad.thumbnail || ad.image || (ad.images && ad.images[0]?.original) || '',
            location: [ad.location?.neighbourhood, ad.location?.municipality, ad.location?.uf].filter(Boolean).join(', ') || ad.locationLabel || '',
            date: ad.listTime || ad.date || '',
            source: 'olx-br',
          };
        }).filter(item => item.title && item.url);
      } catch (e) {
        return null;
      }
    }, searchTerm);

    if (nextDataItems && nextDataItems.length > 0) {
      this.log(`✅ Extracted ${nextDataItems.length} items from __NEXT_DATA__`);
      return nextDataItems;
    }

    this.log('⚠️ No __NEXT_DATA__, falling back to DOM extraction...');

    // ── Strategy 2: Wait for and try DOM selectors ──
    try {
      await page.waitForSelector(
        '[data-ds-component="DS-NewAdCard-horizontal"], [data-ds-component="DS-NewAdCard"], #ad-list, a[data-lurker-detail], section li a, [class*="adCard"], [class*="listing"], [data-cy="l-card"], article',
        { timeout: 15000 }
      );
      this.log('✅ Found listing container');
    } catch (e) {
      this.log('⚠️ Could not find listing container, proceeding anyway...', 'warn');
    }

    const items = await page.evaluate(() => {
      const results = [];
      const SKIP_HREF = /google\.|doubleclick|facebook\.com|analytics|login|cadastro|conta\/|ajuda\//i;

      function extractImage(card) {
        const imgEls = card.querySelectorAll('img');
        for (const imgEl of imgEls) {
          const srcset = imgEl.getAttribute('srcset') || imgEl.getAttribute('data-srcset') || '';
          if (srcset) {
            const parts = srcset.split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
            if (parts.length > 0) return parts[parts.length - 1];
          }
          const src = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy') || '';
          if (src && !src.includes('data:image') && !src.includes('placeholder') && !src.includes('no_thumbnail') && src.length > 10) return src;
        }
        const bgEl = card.querySelector('[style*="background-image"]');
        if (bgEl) {
          const match = bgEl.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
          if (match && !match[1].includes('data:image')) return match[1];
        }
        return '';
      }

      // Try selectors from most specific to most generic
      let cards = document.querySelectorAll('[data-ds-component="DS-NewAdCard-horizontal"]');
      if (cards.length === 0) cards = document.querySelectorAll('[data-ds-component="DS-NewAdCard"]');
      if (cards.length === 0) cards = document.querySelectorAll('[data-cy="l-card"]');
      if (cards.length === 0) cards = document.querySelectorAll('a[data-lurker-detail]');
      if (cards.length === 0) cards = document.querySelectorAll('#ad-list > li');
      if (cards.length === 0) cards = document.querySelectorAll('#ad-list li');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="olx-ad-card"]');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="AdCard"]');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="adCard"]');
      if (cards.length === 0) cards = document.querySelectorAll('[class*="ad-card"]');
      if (cards.length === 0) cards = document.querySelectorAll('section ul li');
      if (cards.length === 0) cards = document.querySelectorAll('article');

      // Last resort: links to OLX item pages
      if (cards.length === 0) {
        const allLinks = [...document.querySelectorAll('a[href*="olx.com.br"]')];
        cards = allLinks.filter(a => {
          const h = a.href || '';
          return (h.includes('/item/') || h.includes('/d/')) && !SKIP_HREF.test(h);
        });
      }

      cards.forEach(card => {
        try {
          if (card.querySelector('[data-lurker_position="sponsored"]')) return;
          if (card.getAttribute('data-lurker_position') === 'sponsored') return;
          if (card.closest('[data-lurker_position="sponsored"]')) return;

          const link = card.querySelector('a[href*="olx.com.br"]') || card.querySelector('a') || card.closest('a') || card;
          const href = link?.href || '';
          if (!href || SKIP_HREF.test(href)) return;

          const titleEl = card.querySelector('h2, h3, h4, h5, h6, [data-ds-component="DS-Text"]');
          let title = titleEl?.innerText?.trim() || '';
          if (!title && card.tagName === 'A') {
            title = card.innerText?.split('\n')[0]?.trim() || '';
          }
          if (!title || title.length < 2) return;

          const priceEl = card.querySelector(
            '[data-ds-component="DS-Text"][color="gray-600"], ' +
            'span[aria-label*="preço"], span[aria-label*="R\\$"], ' +
            '.price, [class*="price"], [class*="Price"]'
          );
          let price = priceEl?.innerText?.trim() || '';
          if (!price) {
            const priceMatch = (card.innerText || '').match(/R\$\s*[\d.]+(?:,\d{2})?/);
            if (priceMatch) price = priceMatch[0];
          }

          const image = extractImage(card);

          const locationEl = card.querySelector(
            'span[aria-label*="local"], .location, [class*="location"], [class*="Location"]'
          );
          const location = locationEl?.innerText?.trim() || '';

          const dateEl = card.querySelector(
            '[class*="date"], [class*="Date"], [class*="time"], [class*="Time"], span[aria-label*="data"]'
          );
          let date = dateEl?.innerText?.trim() || '';
          if (!date && location) {
            const dateMatch = location.match(/(Hoje|Ontem|há\s+\d+\s+\w+|\d{1,2}\s+\w{3}\.?(?:\s+\d{2}:\d{2})?)/i);
            if (dateMatch) date = dateMatch[1];
          }

          results.push({ title, price, url: href, image, location, date, source: 'olx-br' });
        } catch (e) { /* skip */ }
      });

      return results;
    });

    if (items.length === 0) {
      const bodySnippet = await page.evaluate(() => document.body?.innerText?.substring(0, 1500) || '');
      this.log(`⚠️ No items extracted. Body text: ${bodySnippet.replace(/\n/g, ' ').substring(0, 800)}`, 'warn');
      this.log(`⚠️ Current page URL: ${page.url()}`, 'warn');
    }

    this.log(`✅ Extracted ${items.length} items (after filtering)`);
    return items;
  }
}

export default OlxBrScraper;
