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
 * SSE streaming search — results stream per-platform as each scraper finishes.
 *
 * @param {string}   query
 * @param {string[]|null} platforms  - specific platforms, or null for all
 * @param {string}   vintedCountry
 * @param {Object}   callbacks
 *   .onQueued(platforms)                 - called once with all queued platforms
 *   .onLoading(platform)                 - called when a platform starts scraping
 *   .onPlatformResult({platform, items, stat, status, error})
 *   .onDone({wallTimeMs})               - called after all platforms finish
 *   .onError(message)                    - called on connection / server error
 *
 * @returns {() => void}  abort function — call to close the stream early
 */
export const crawlSearchStream = (
  query,
  platforms = null,
  vintedCountry = 'pt',
  { onQueued, onLoading, onPlatformResult, onDone, onError } = {},
) => {
  const params = new URLSearchParams({ query, vintedCountry });
  if (platforms?.length) params.set('platforms', platforms.join(','));

  const url = `${API_BASE_URL}/crawl/search-stream?${params}`;
  const es = new EventSource(url);

  const close = () => { try { es.close(); } catch (_) {} };

  es.addEventListener('queued', (e) => {
    try { onQueued?.(JSON.parse(e.data).platforms); } catch (_) {}
  });

  es.addEventListener('loading', (e) => {
    try { onLoading?.(JSON.parse(e.data).platform); } catch (_) {}
  });

  es.addEventListener('platform_result', (e) => {
    try { onPlatformResult?.(JSON.parse(e.data)); } catch (_) {}
  });

  es.addEventListener('done', (e) => {
    try { onDone?.(JSON.parse(e.data)); } catch (_) {}
    close();
  });

  es.addEventListener('error', (e) => {
    try {
      if (e.data) onError?.(JSON.parse(e.data).message);
    } catch (_) {}
    close();
  });

  // Network-level error (e.g. server not running)
  es.onerror = () => {
    onError?.('Could not connect to search stream');
    close();
  };

  return close;
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
    // Send only URLs/IDs for dedup instead of full items (avoids payload size issues)
    const existingUrls = existingItems.map(item => item.url).filter(Boolean);
    const response = await axios.post(`${API_BASE_URL}/crawl/more`, {
      query,
      platforms,
      pages,
      existingItems: existingUrls.map(url => ({ url })),
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

