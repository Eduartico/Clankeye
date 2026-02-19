import searchService from '../services/searchService.js';

/**
 * Search Controller - Handles search API endpoints
 */

/**
 * Search across all or specified platforms
 * GET /api/search
 */
export const search = async (req, res) => {
  try {
    const { 
      query,
      platforms,
      limit,
      offset,
      page,
      sort,
      minPrice,
      maxPrice,
      currency,
      condition,
      category,
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
      });
    }

    const platformList = platforms 
      ? platforms.split(',').map(p => p.trim())
      : null;

    const results = await searchService.search({
      platforms: platformList,
      query,
      options: {
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
        page: page ? parseInt(page) : 1,
        sort: sort || 'relevance',
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        currency,
        condition,
        category,
      },
    });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Search a specific platform
 * GET /api/search/:platform
 */
export const searchPlatform = async (req, res) => {
  try {
    const { platform } = req.params;
    const { 
      query,
      limit,
      offset,
      page,
      sort,
      minPrice,
      maxPrice,
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
      });
    }

    const result = await searchService.searchSingle(platform, {
      query,
      options: {
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
        page: page ? parseInt(page) : 1,
        sort: sort || 'relevance',
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      },
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Platform search error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  search,
  searchPlatform,
};
