/**
 * 🕷️ Crawl Controller - API endpoints for Crawlee-based scraping
 * 
 * Provides parallel search, "get more items" pagination,
 * and duplicate detection across platforms.
 */

import searchOrchestrator from '../services/searchOrchestrator.js';

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

export default {
  crawlSearch,
  crawlSearchGet,
  crawlMore,
  crawlPlatforms,
};
