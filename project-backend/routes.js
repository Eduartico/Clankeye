import express from 'express';

// New architecture controllers
import searchController from './controllers/searchController.js';
import platformController from './controllers/platformController.js';
import healthController from './controllers/healthController.js';

// Legacy controllers (for backward compatibility)
import { fetchOffers as fetchOlxOffers } from './controllers/olxController.js';
import { fetchVintedOffers } from './controllers/vintedController.js';
import { fetchAllOffers } from './controllers/generalController.js';

const router = express.Router();

// ============================================
// New API Routes (v2 architecture)
// ============================================

// Search endpoints
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
// Legacy Routes (backward compatibility)
// ============================================

router.get('/olx/offers', fetchOlxOffers);
router.get('/vinted/offers', fetchVintedOffers);
router.get('/all-offers', fetchAllOffers);

export default router;
