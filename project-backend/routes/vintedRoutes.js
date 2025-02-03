import express from 'express';
import { fetchVintedOffers } from '../controllers/vintedController.js';

const router = express.Router();

router.get('/fetch-offers', fetchVintedOffers);

export default router;
