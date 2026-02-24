import BaseScraper from '../BaseScraper.js';
import axios from 'axios';
import { randomUUID } from 'crypto';

/**
 * Leboncoin scraper — uses Brave Search as a proxy to bypass Datadome anti-bot.
 *
 * LeBonCoin deploys aggressive Datadome captcha protection that blocks:
 *   - All headless browsers (Chromium, Firefox, WebKit)
 *   - All direct API calls (403 on /finder/search)
 *   - Puppeteer-Extra + Stealth plugin
 *   - Google/Bing/DDG scraping (they also block bots or return 0 results)
 *
 * Strategy:
 *   1. Query Brave Search with `site:leboncoin.fr/ad/ <searchTerm>`
 *      - Brave returns server-rendered HTML (~180 KB) with real LBC ad URLs
 *      - The `site:` prefix ensures we only get individual ad pages (/ad/*)
 *   2. Parse the Svelte-based Brave HTML to extract title, URL, description
 *   3. Extract price from the description/title when available
 *   4. Map to the standard item format used by the orchestrator
 *
 * Limitations:
 *   - No images (Brave doesn't include LBC thumbnails)
 *   - Prices only when mentioned in the snippet text
 *   - ~20 results per query (Brave's default page size)
 *   - No location/date info (would require visiting the ad page, which is blocked)
 */

const BRAVE_SEARCH_URL = 'https://search.brave.com/search';
const BRAVE_TIMEOUT_MS = 15000;
const DELAY_BETWEEN_REQUESTS_MS = 1200;

class LeboncoinScraper extends BaseScraper {
  constructor(config = {}) {
    super('leboncoin', config);
  }

  /**
   * Build the direct LeBonCoin search URL (kept for reference/display purposes).
   */
  buildSearchUrl(searchTerm, page = 1) {
    let url = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(searchTerm)}&sort=time&order=desc`;
    if (page > 1) url += `&page=${page}`;
    return url;
  }

  /**
   * Main search — overrides BaseScraper.search() entirely.
   * Uses Brave Search HTTP requests instead of Crawlee/Playwright.
   */
  async search(searchTerm, page = 1) {
    this.results = [];
    this.log(`🚀 Starting Brave Search for "${searchTerm}" (page ${page})`);

    try {
      this.results = await this._searchViaBrave(searchTerm, page);
    } catch (e) {
      this.log(`❌ Brave Search error: ${e.message}`, 'error');
    }

    this.log(`🏁 Done — ${this.results.length} items found.`);
    if (this.results.length > 0) {
      this.results.slice(0, 3).forEach((item, i) =>
        this.log(`   [${i}] ${item.title} | ${item.price || 'no price'} | ${item.url}`)
      );
      if (this.results.length > 3) this.log(`   ... and ${this.results.length - 3} more`);
    }
    return this.results;
  }

  /**
   * Query Brave Search and parse results.
   * Uses `site:leboncoin.fr/ad/ <term>` to get individual ad listings.
   */
  async _searchViaBrave(searchTerm, page) {
    const allResults = [];
    const seenUrls = new Set();

    // Primary query: only individual ad pages
    const queries = [
      `site:leboncoin.fr/ad/ ${searchTerm}`,
    ];

    for (const query of queries) {
      try {
        const offset = (page - 1) * 20;
        const params = { q: query, source: 'web' };
        if (offset > 0) params.offset = offset;

        this.log(`🔍 Brave query: "${query}" (offset: ${offset})`);

        const resp = await axios.get(BRAVE_SEARCH_URL, {
          params,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
          },
          timeout: BRAVE_TIMEOUT_MS,
        });

        const html = resp.data;
        this.log(`📄 Brave returned ${html.length} bytes`);

        const results = this._parseBraveHTML(html);

        for (const r of results) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            allResults.push(r);
          }
        }

        this.log(`✅ Parsed ${results.length} results (${allResults.length} unique total)`);
      } catch (e) {
        const status = e.response?.status || '';
        this.log(`⚠️ Brave query failed: ${status} ${e.message}`, 'warn');
      }

      // Polite delay between requests
      if (queries.length > 1) {
        await this._sleep(DELAY_BETWEEN_REQUESTS_MS);
      }
    }

    return allResults;
  }

  /**
   * Parse Brave Search's server-rendered HTML to extract LeBonCoin results.
   *
   * Brave HTML structure (Svelte-based):
   *
   *   <div class="snippet svelte-..." data-pos="N" data-type="web">
   *     <div class="result-wrapper svelte-...">
   *       <div class="result-content svelte-...">
   *         <a href="https://www.leboncoin.fr/ad/..." class="svelte-... l1">
   *           ...
   *           <div class="title search-snippet-title ..." title="FULL TITLE">TITLE</div>
   *         </a>
   *         <div class="generic-snippet svelte-...">
   *           <div class="content ... line-clamp-dynamic svelte-...">DESCRIPTION</div>
   *         </div>
   *       </div>
   *     </div>
   *   </div>
   */
  _parseBraveHTML(html) {
    const results = [];

    // Find each result block by data-pos attribute
    const positions = [];
    const posRegex = /data-pos="(\d+)"\s+data-type="web"/g;
    let posMatch;
    while ((posMatch = posRegex.exec(html)) !== null) {
      positions.push({ pos: parseInt(posMatch[1]), index: posMatch.index });
    }

    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].index;
      const end = i + 1 < positions.length ? positions[i + 1].index : start + 8000;
      const block = html.substring(start, end);

      // Extract URL — must be a leboncoin.fr URL
      const urlMatch = block.match(/<a[^>]*href="(https?:\/\/www\.leboncoin\.fr\/[^"]+)"[^>]*>/);
      if (!urlMatch) continue;
      const url = this._decodeHtmlEntities(urlMatch[1]);

      // Only keep individual ad pages (/ad/...)
      if (!url.includes('/ad/')) continue;

      // Extract title from the title="" attribute of the search-snippet-title div
      let title = '';
      const titleAttrMatch = block.match(/class="[^"]*search-snippet-title[^"]*"[^>]*title="([^"]+)"/);
      if (titleAttrMatch) {
        title = this._decodeHtmlEntities(titleAttrMatch[1]);
      } else {
        // Fallback: get title from inside the title div
        const titleTextMatch = block.match(/class="[^"]*search-snippet-title[^"]*"[^>]*>([^<]+)</);
        if (titleTextMatch) title = this._decodeHtmlEntities(titleTextMatch[1].trim());
      }

      // Clean title: remove " - leboncoin" suffix and similar
      title = title
        .replace(/\s*[-–|]\s*leboncoin\s*$/i, '')
        .replace(/\s*[-–|]\s*[Ll]e\s*[Bb]on\s*[Cc]oin\s*$/i, '')
        .trim();

      if (!title) continue;

      // ── Extract image from Brave result block ──
      // Brave sometimes includes thumbnail/preview images for results
      let image = '';
      // Look for thumbnail in the result block (Brave product cards, image preview)
      const imgPatterns = [
        // Brave img tag inside the snippet block
        /<img[^>]*src="(https?:\/\/[^"]+(?:\.jpg|\.jpeg|\.png|\.webp)[^"]*)"[^>]*>/i,
        // Brave sometimes wraps images in a figure or card-image
        /class="[^"]*(?:thumb|image|card-img|preview)[^"]*"[^>]*>\s*<img[^>]*src="(https?:\/\/[^"]+)"[^>]*>/i,
        // Data-src or lazy-loaded images
        /<img[^>]*data-src="(https?:\/\/[^"]+(?:\.jpg|\.jpeg|\.png|\.webp)[^"]*)"[^>]*>/i,
        // Background image in style attribute
        /style="[^"]*background-image:\s*url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/i,
        // Brave's image proxy format
        /src="(https?:\/\/imgs\.search\.brave\.com\/[^"]+)"/i,
      ];
      for (const pattern of imgPatterns) {
        const imgMatch = block.match(pattern);
        if (imgMatch && imgMatch[1]) {
          image = this._decodeHtmlEntities(imgMatch[1]);
          break;
        }
      }

      // Extract description — Brave uses different layouts for ad pages vs category pages
      let description = '';

      // Layout 1: Product review block (individual ad pages)
      // <div class="product-review ..."><strong>Title</strong><div class="line-clamp-2">DESCRIPTION</div>
      const productReviewMatch = block.match(/class="[^"]*product-review[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
      if (productReviewMatch) {
        const reviewBlock = productReviewMatch[1];
        const lineClampMatch = reviewBlock.match(/class="line-clamp-2[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        if (lineClampMatch) {
          description = lineClampMatch[1]
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<[^>]+>/g, '')
            .trim();
        }
      }

      // Layout 2: Generic snippet (category/search pages)
      if (!description) {
        const genericMatch = block.match(/class="[^"]*generic-snippet[^"]*"[^>]*>\s*<div[^>]*class="content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        if (genericMatch) {
          description = genericMatch[1]
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<[^>]+>/g, '')
            .trim();
        }
      }

      // Extract price — Brave shows structured price data for ad pages
      let price = '';

      // Strategy 1: Structured price in attributes block (e.g., <span class="t-tertiary">€790.00</span>)
      const attrPriceMatch = block.match(/class="attributes[^"]*"[\s\S]*?<span[^>]*class="t-tertiary"[^>]*>([^<]+)<\/span>/);
      if (attrPriceMatch) {
        const raw = attrPriceMatch[1].trim();
        // Handle €NNN.NN format (Brave's structured price)
        const euroPrefix = raw.match(/€\s*([\d,.]+)/);
        if (euroPrefix) {
          price = `${euroPrefix[1]} EUR`;
        } else {
          const euroSuffix = raw.match(/([\d,.]+)\s*€/);
          if (euroSuffix) price = `${euroSuffix[1]} EUR`;
        }
      }

      // Strategy 2: Price in title or description text
      if (!price) {
        const combined = title + ' ' + description;
        const pricePatterns = [
          /€\s*([\d,.]+)/,                                // €790.00
          /([\d][\d\s,.]*)\s*€/,                          // 350 €
          /([\d][\d\s,.]*)\s*EUR\b/i,                     // 350 EUR
          /prix\s*:?\s*([\d][\d\s,.]*)\s*€?/i,            // prix: 350 €
          /([\d][\d\s,.]*)\s*euros?\b/i,                   // 350 euros
        ];
        for (const pattern of pricePatterns) {
          const pm = combined.match(pattern);
          if (pm) {
            price = pm[1].replace(/\s/g, '').trim().replace(/[.,]$/, '');
            price = `${price} EUR`;
            break;
          }
        }
      }

      // Extract category from title suffix (e.g., "PS5 - Consoles" → category = "Consoles")
      let category = '';
      const catMatch = title.match(/\s*-\s*([A-ZÀ-ÿ][^-]+)$/);
      if (catMatch) {
        category = catMatch[1].trim();
        title = title.replace(/\s*-\s*[A-ZÀ-ÿ][^-]+$/, '').trim();
      }

      // Extract ad ID from URL: /ad/category/12345678
      const idMatch = url.match(/\/ad\/[^/]+\/(\d+)/);
      const externalId = idMatch ? idMatch[1] : randomUUID();

      results.push({
        title,
        price,
        url,
        image,
        location: '',
        createdTime: '',
        source: 'leboncoin',
        externalId,
        description,
        category,
      });
    }

    return results;
  }

  /**
   * Decode common HTML entities
   */
  _decodeHtmlEntities(str) {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default LeboncoinScraper;
