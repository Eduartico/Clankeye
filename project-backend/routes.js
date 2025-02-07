import express from 'express';
import { fetchOlxOffers } from './controllers/olxController.js';
import { fetchVintedOffers } from './controllers/vintedController.js';
import { fetchAllOffers } from './controllers/generalController.js';

const router = express.Router();

router.get('/olx/offers', fetchOlxOffers);
router.get('/vinted/offers', fetchVintedOffers);

router.get('/all-offers', fetchAllOffers);

export default router;
