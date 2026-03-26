import BaseScraper from '../BaseScraper.js';
import axios from 'axios';
import { randomUUID } from 'crypto';
import browserManager from '../BrowserManager.js';

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
 *   1. Query Brave Search with `site:leboncoin.fr <searchTerm>` (broad site restriction)
 *      - Broad query catches more pages than the earlier /ad/ path restriction
 *      - We fetch Brave result pages 1 AND 2 (offsets 0 + 20) in a single call
 *        so we can return up to ~35-40 results, matching LBC's native page size
 *      - URLs are still filtered to /ad/ paths in the HTML parser
 *   2. Parse the Svelte-based Brave HTML to extract title, URL, description
 *   3. Extract price from the description/title when available
 *   4. Map to the standard item format used by the orchestrator
 *
 * Limitations:
 *   - Images are fetched via OG meta tags (lightweight HEAD-like request per ad URL)
 *   - Prices only when mentioned in the snippet text
 *   - No location/date info (would require visiting the ad page, which is blocked)
 */

const BRAVE_SEARCH_URL = 'https://search.brave.com/search';
const BRAVE_TIMEOUT_MS = 15000;
const DELAY_BETWEEN_REQUESTS_MS = 2500;

// How many Brave result pages to fetch per scraper page (20 results each)
// 2 pages yields ~15-20 ad URLs, matching LBC's native page size
const BRAVE_PAGES_PER_SCRAPER_PAGE = 2;
// Concurrent OG image fetches
const IMAGE_FETCH_CONCURRENCY = 6;
const IMAGE_FETCH_TIMEOUT_MS = 5000;

// Retry config for 429 rate-limit responses
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 2000;

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

      // If HTTP requests got rate-limited, fall back to DuckDuckGo HTML
      if (this.results.length === 0) {
        this.log('🔄 Brave returned 0 results — trying DuckDuckGo HTML fallback...');
        this.results = await this._searchViaDDG(searchTerm, page);
      }

      // Second pass: fetch OG images for results that lack an image
      const needImage = this.results.filter(r => !r.image);
      if (needImage.length > 0) {
        this.log(`🖼️ Fetching OG images for ${needImage.length} items...`);
        await this._fetchOGImages(needImage);
        const gotImage = needImage.filter(r => r.image).length;
        this.log(`🖼️ Got images for ${gotImage}/${needImage.length} items`);
      }
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
   * Uses `site:leboncoin.fr <term>` (broad site restriction) and fetches 2
   * Brave pages (offset 0 + 20) to overcome Brave's ~20-result-per-page cap.
   * Result URLs are still filtered to /ad/ paths in _parseBraveHTML.
   */
  async _searchViaBrave(searchTerm, page) {
    const allResults = [];
    const seenUrls = new Set();

    // Broad site query — Brave indexes LBC search/category pages too, but we filter
    // to /ad/ URLs afterwards. A broad query yields far more hits than /ad/ restriction.
    const query = `site:leboncoin.fr ${searchTerm}`;

    // Fetch multiple Brave pages per scraper page to maximise ad URL yield.
    // Brave returns ~20 results per page, but only a fraction are /ad/ URLs.
    const braveOffsets = [];
    const baseOffset = (page - 1) * BRAVE_PAGES_PER_SCRAPER_PAGE * 20;
    for (let i = 0; i < BRAVE_PAGES_PER_SCRAPER_PAGE; i++) {
      braveOffsets.push(baseOffset + i * 20);
    }

    for (const offset of braveOffsets) {
      let success = false;
      for (let attempt = 1; attempt <= MAX_RETRIES && !success; attempt++) {
        try {
          const params = { q: query, source: 'web' };
          if (offset > 0) params.offset = offset;

          this.log(`🔍 Brave query: "${query}" (offset: ${offset}, attempt ${attempt}/${MAX_RETRIES})`);

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

          // Detect PoW captcha page (Brave serves 200 but with a challenge)
          if (html.includes('PoW Captcha') || html.includes('pow_captcha')) {
            this.log('⚠️ Brave served a PoW captcha page (not real results)', 'warn');
            throw Object.assign(new Error('PoW captcha page'), { response: { status: 429 } });
          }

          const results = this._parseBraveHTML(html);

          for (const r of results) {
            if (!seenUrls.has(r.url)) {
              seenUrls.add(r.url);
              allResults.push(r);
            }
          }

          this.log(`✅ Parsed ${results.length} results (${allResults.length} unique total)`);
          success = true;
        } catch (e) {
          const status = e.response?.status || '';
          this.log(`⚠️ Brave query failed (offset ${offset}, attempt ${attempt}): ${status} ${e.message}`, 'warn');

          // Retry on 429 rate-limit with exponential backoff
          if (status === 429 && attempt < MAX_RETRIES) {
            const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
            this.log(`⏳ Rate limited — retrying in ${backoff}ms...`, 'warn');
            await this._sleep(backoff);
          }
        }
      }

      // Polite delay between requests
      await this._sleep(DELAY_BETWEEN_REQUESTS_MS);
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

  /**
   * Fetch OpenGraph images from LeBonCoin ad pages.
   * Uses lightweight partial GET requests to extract og:image meta tags.
   * Processes items in batches to avoid overloading.
   */
  async _fetchOGImages(items) {
    const queue = [...items];
    const workers = Array.from({ length: Math.min(IMAGE_FETCH_CONCURRENCY, queue.length) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item || item.image) continue;
        try {
          const resp = await axios.get(item.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
              'Accept': 'text/html',
            },
            timeout: IMAGE_FETCH_TIMEOUT_MS,
            maxRedirects: 3,
            // Only download first 32KB — OG tags are in the <head>
            transformResponse: [(data) => data],
            maxContentLength: 32 * 1024,
          });
          const html = typeof resp.data === 'string' ? resp.data : '';
          // Extract og:image meta tag
          const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
          if (ogMatch && ogMatch[1]) {
            item.image = this._decodeHtmlEntities(ogMatch[1]);
          }
        } catch (_) {
          // Silently skip — image is a nice-to-have
        }
      }
    });
    await Promise.all(workers);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fallback: use Playwright browser to access DuckDuckGo when Brave is rate-limited.
   * A real browser can solve DDG's bot-challenge that blocks plain HTTP requests.
   */
  async _searchViaDDG(searchTerm, page) {
    const allResults = [];
    const seenUrls = new Set();
    const query = `site:leboncoin.fr ${searchTerm}`;

    this.log(`🦆 DDG browser fallback: searching "${query}"...`);

    const context = await browserManager.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'fr-FR',
      viewport: { width: 1280, height: 800 },
    });

    try {
      const browserPage = await context.newPage();
      await browserPage.route('**/*.{woff,woff2,ttf,eot,mp4,webm}', route => route.abort());

      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      await browserPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

      // Wait for DDG challenge to resolve (polls for result links)
      let resolved = false;
      for (let wait = 0; wait < 15 && !resolved; wait++) {
        await browserPage.waitForTimeout(1500);
        const hasResults = await browserPage.evaluate(
          () => document.querySelectorAll('.result__a, .result__url').length > 0
        );
        if (hasResults) {
          resolved = true;
          this.log(`✅ DDG challenge resolved after ${(wait + 1) * 1.5}s`);
        }
      }

      if (!resolved) {
        this.log('⚠️ DDG did not show results within 22s', 'warn');
        return allResults;
      }

      // Extract results from the rendered page
      const items = await browserPage.evaluate(() => {
        const results = [];
        document.querySelectorAll('.result').forEach(el => {
          const linkEl = el.querySelector('.result__a');
          const snippetEl = el.querySelector('.result__snippet');
          if (!linkEl) return;

          let href = linkEl.getAttribute('href') || '';
          // DDG wraps URLs in a redirect
          const uddgMatch = href.match(/uddg=([^&]+)/);
          if (uddgMatch) href = decodeURIComponent(uddgMatch[1]);

          const title = linkEl.textContent?.trim() || '';
          const snippet = snippetEl?.textContent?.trim() || '';
          results.push({ href, title, snippet });
        });
        return results;
      });

      for (const item of items) {
        const url = item.href;
        if (!url.includes('leboncoin.fr') || !url.includes('/ad/')) continue;
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        let title = item.title
          .replace(/\s*[-–|]\s*leboncoin\s*$/i, '')
          .replace(/\s*[-–|]\s*[Ll]e\s*[Bb]on\s*[Cc]oin\s*$/i, '')
          .trim();
        if (!title) continue;

        // Extract price
        let price = '';
        const combined = title + ' ' + item.snippet;
        const pricePatterns = [
          /€\s*([\d,.]+)/,
          /([\d][\d\s,.]*)\s*€/,
          /([\d][\d\s,.]*)\s*EUR\b/i,
        ];
        for (const pattern of pricePatterns) {
          const pm = combined.match(pattern);
          if (pm) {
            price = pm[1].replace(/\s/g, '').trim().replace(/[.,]$/, '');
            price = `${price} EUR`;
            break;
          }
        }

        const idMatch = url.match(/\/ad\/[^/]+\/(\d+)/);
        const externalId = idMatch ? idMatch[1] : randomUUID();

        allResults.push({
          title,
          price,
          url,
          image: '',
          location: '',
          createdTime: '',
          source: 'leboncoin',
          externalId,
          description: item.snippet,
          category: '',
        });
      }

      this.log(`✅ DDG browser parsed ${allResults.length} results`);
    } catch (e) {
      this.log(`⚠️ DDG browser fallback failed: ${e.message}`, 'warn');
    } finally {
      await browserManager.closeContext(context);
    }

    return allResults;
  }
}

export default LeboncoinScraper;
