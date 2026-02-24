import express from 'express';

// New architecture controllers
import searchController from './controllers/searchController.js';
import platformController from './controllers/platformController.js';
import healthController from './controllers/healthController.js';
import crawlController from './controllers/crawlController.js';
import * as termsController from './controllers/termsController.js';

// Legacy controllers (for backward compatibility)
import { fetchOffers as fetchOlxOffers } from './controllers/olxController.js';
import { fetchVintedOffers } from './controllers/vintedController.js';
import { fetchAllOffers } from './controllers/generalController.js';

const router = express.Router();

// ============================================
// Crawl API Routes (Crawlee-based scraping)
// ============================================

// Parallel search across all platforms (POST with body params)
router.post('/crawl/search', crawlController.crawlSearch);

// Parallel search (GET for browser testing)
router.get('/crawl/search', crawlController.crawlSearchGet);

// SSE streaming search — streams per-platform results as they arrive
router.get('/crawl/search-stream', crawlController.crawlSearchStream);

// "Get more items" - paginated fetching for specific platforms
router.post('/crawl/more', crawlController.crawlMore);

// List available crawl platforms
router.get('/crawl/platforms', crawlController.crawlPlatforms);

// ============================================
// Search API Routes (v2 platform adapters)
// ============================================

router.get('/search', searchController.search);
router.get('/search/:platform', searchController.searchPlatform);

// Platform management
router.get('/platforms', platformController.list);
router.get('/platforms/status/all', platformController.allStatus);
router.get('/platforms/:name', platformController.get);
router.get('/platforms/:name/status', platformController.status);

// Health & status
router.get('/health', healthController.check);
router.get('/status', healthController.detailed);

// ============================================
// Wishlist & Filter Terms Routes
// ============================================

// Wishlist
router.get('/terms/wishlist', termsController.getWishlist);
router.put('/terms/wishlist', termsController.updateWishlist);
router.post('/terms/wishlist/add', termsController.addToWishlist);
router.post('/terms/wishlist/remove', termsController.removeFromWishlist);

// Filter
router.get('/terms/filter', termsController.getFilter);
router.put('/terms/filter', termsController.updateFilter);
router.post('/terms/filter/add', termsController.addToFilter);
router.post('/terms/filter/remove', termsController.removeFromFilter);

// ============================================
// Legacy Routes (backward compatibility)
// ============================================

router.get('/olx/offers', fetchOlxOffers);
router.get('/vinted/offers', fetchVintedOffers);
router.get('/all-offers', fetchAllOffers);

export default router;
