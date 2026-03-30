/**
 * 🕷️ Crawl Controller - API endpoints for Crawlee-based scraping
 * 
 * Provides parallel search, "get more items" pagination,
 * and duplicate detection across platforms.
 */

import searchOrchestrator from '../services/searchOrchestrator.js';

// ─── SSE helper ──────────────────────────────────────────────────────────────

function sendSSE(res, event, data) {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    // flush immediately if supported (e.g. compression middleware)
    if (typeof res.flush === 'function') res.flush();
  } catch (_) { /* client already disconnected */ }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * Parallel search across all platforms
 * POST /api/crawl/search
 * 
 * Body:
 * {
 *   "query": "clone wars",
 *   "platforms": ["ebay", "vinted"],  // optional, defaults to all
 *   "pages": { "ebay": 1, "vinted": 1 },  // optional, defaults to 1
 *   "detectDuplicates": true  // optional, defaults to true
 * }
 */
export const crawlSearch = async (req, res) => {
  try {
    const { query, platforms, pages, detectDuplicates, vintedCountry } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required in request body',
      });
    }

    const results = await searchOrchestrator.search({
      query,
      platforms,
      pages: pages || {},
      detectDuplicates: detectDuplicates !== false,
      vintedCountry: vintedCountry || 'pt',
    });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Crawl search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET version for simpler use / browser testing
 * GET /api/crawl/search?query=clone+wars&platforms=ebay,vinted
 */
export const crawlSearchGet = async (req, res) => {
  try {
    const { query, platforms, page } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
      });
    }

    const platformList = platforms
      ? platforms.split(',').map(p => p.trim())
      : undefined;

    // Build pages object (same page for all platforms if single page param)
    const pageNum = page ? parseInt(page) : 1;
    const pages = {};
    if (platformList) {
      platformList.forEach(p => { pages[p] = pageNum; });
    }

    const results = await searchOrchestrator.search({
      query,
      platforms: platformList,
      pages,
    });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Crawl search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * "Get more items" - fetch next page from specific platforms
 * POST /api/crawl/more
 * 
 * Body:
 * {
 *   "query": "clone wars",
 *   "platforms": ["ebay"],
 *   "pages": { "ebay": 2 },
 *   "existingItems": [...]  // previously fetched items for dedup
 * }
 */
export const crawlMore = async (req, res) => {
  try {
    const { query, platforms, pages, existingItems, vintedCountry } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    if (!platforms?.length) {
      return res.status(400).json({
        success: false,
        error: 'Platforms array is required - specify which platforms to fetch more from',
      });
    }

    if (!pages || Object.keys(pages).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Pages object is required with per-platform page numbers',
      });
    }

    const results = await searchOrchestrator.getMore({
      query,
      platforms,
      pages,
      existingItems: existingItems || [],
      vintedCountry: vintedCountry || 'pt',
    });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Crawl more error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get available platforms for crawling
 * GET /api/crawl/platforms
 */
export const crawlPlatforms = async (req, res) => {
  try {
    const platforms = searchOrchestrator.getAvailablePlatforms();
    res.status(200).json({
      success: true,
      data: {
        platforms,
        count: platforms.length,
      },
    });
  } catch (error) {
    console.error('Crawl platforms error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * SSE streaming search — streams per-platform results as they arrive.
 * GET /crawl/search-stream?query=...&platforms=ebay,vinted&vintedCountry=pt
 *
 * Events emitted:
 *   queued          { platforms: string[] }
 *   loading         { platform: string }
 *   platform_result { platform, items, stat, status }
 *   done            { wallTimeMs }
 *   error           { message }
 */
export const crawlSearchStream = async (req, res) => {
  const { query, platforms: platformsParam, vintedCountry = 'pt' } = req.query;

  if (!query) {
    return res.status(400).json({ success: false, error: 'query is required' });
  }

  // ── SSE headers ──────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Track whether client disconnected early
  let closed = false;
  req.on('close', () => { closed = true; });

  const safeSend = (event, data) => {
    if (!closed) sendSSE(res, event, data);
  };

  const platformList = platformsParam
    ? platformsParam.split(',').map(p => p.trim()).filter(Boolean)
    : searchOrchestrator.getAvailablePlatforms();

  // Immediately tell the client which platforms are queued
  safeSend('queued', { platforms: platformList });

  const startTime = Date.now();

  try {
    await searchOrchestrator.searchWithCallback({
      query,
      platforms: platformList,
      vintedCountry,
      onPlatformStart: (platform) => {
        safeSend('loading', { platform });
      },
      onPlatformDone: (platform, result) => {
        const stat = {
          page: result.page,
          count: result.items.length,
          timeMs: result.elapsed,
          success: !result.error,
        };
        const status = !stat.success ? 'failed' : stat.count === 0 ? 'empty' : 'done';

        // Tag items with source platform
        const items = result.items.map(item => ({
          ...item,
          source: item.source || platform,
          _scrapedAt: new Date().toISOString(),
        }));

        safeSend('platform_result', { platform, items, stat, status, error: result.error || null });
      },
    });
  } catch (err) {
    safeSend('error', { message: err.message });
  }

  safeSend('done', { wallTimeMs: Date.now() - startTime });
  if (!closed) res.end();
};

export default {
  crawlSearch,
  crawlSearchGet,
  crawlSearchStream,
  crawlMore,
  crawlPlatforms,
};
