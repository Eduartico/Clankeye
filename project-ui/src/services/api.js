import axios from "axios";

const API_BASE_URL = "http://localhost:4000";

// ─── Legacy API ──────────────────────────────────────────────────

export const fetchItems = async (query) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/all-offers`, {
      params: query,
    });
    return response.data.data;
  } catch (error) {
    if(error.status === 512) return await fetchItems(query);
    console.error("Error fetching items:", error.message);
    throw error;
  }
};

// ─── Crawl API (Parallel Scraping) ──────────────────────────────

/**
 * Search across all platforms using Crawlee scrapers (parallel)
 * @param {string} query - Search term
 * @param {string[]} [platforms] - Specific platforms (default: all)
 * @param {Object} [pages] - Per-platform page numbers
 * @returns {Promise<Object>} { items, platformStats, duplicateGroups, meta }
 */
export const crawlSearch = async (query, platforms = null, pages = {}, vintedCountry = 'pt') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/crawl/search`, {
      query,
      platforms,
      pages,
      detectDuplicates: true,
      vintedCountry,
    });
    return response.data.data;
  } catch (error) {
    console.error("Crawl search error:", error.message);
    throw error;
  }
};

/**
 * Fetch more items from specific platforms (next page)
 * @param {string} query - Search term
 * @param {string[]} platforms - Which platforms to fetch more from
 * @param {Object} pages - Per-platform page numbers (incremented)
 * @param {Array} existingItems - Previously loaded items for dedup
 * @returns {Promise<Object>} { newItems, platformStats, duplicateGroups, meta }
 */
export const crawlMore = async (query, platforms, pages, existingItems = [], vintedCountry = 'pt') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/crawl/more`, {
      query,
      platforms,
      pages,
      existingItems,
      vintedCountry,
    });
    return response.data.data;
  } catch (error) {
    console.error("Crawl more error:", error.message);
    throw error;
  }
};

/**
 * Get available crawl platforms
 * @returns {Promise<Object>} { platforms: string[], count: number }
 */
export const getCrawlPlatforms = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/crawl/platforms`);
    return response.data.data;
  } catch (error) {
    console.error("Get crawl platforms error:", error.message);
    throw error;
  }
};

// ─── Wishlist & Filter Terms API ────────────────────────────────

export const getWishlistTerms = async () => {
  const res = await axios.get(`${API_BASE_URL}/terms/wishlist`);
  return res.data.data; // string[]
};

export const addWishlistTerm = async (term) => {
  const res = await axios.post(`${API_BASE_URL}/terms/wishlist/add`, { term });
  return res.data.data;
};

export const removeWishlistTerm = async (term) => {
  const res = await axios.post(`${API_BASE_URL}/terms/wishlist/remove`, { term });
  return res.data.data;
};

export const getFilterTerms = async () => {
  const res = await axios.get(`${API_BASE_URL}/terms/filter`);
  return res.data.data;
};

export const addFilterTerm = async (term) => {
  const res = await axios.post(`${API_BASE_URL}/terms/filter/add`, { term });
  return res.data.data;
};

export const removeFilterTerm = async (term) => {
  const res = await axios.post(`${API_BASE_URL}/terms/filter/remove`, { term });
  return res.data.data;
};

