import express from 'express';
import { fetchOffers } from '../controllers/olxController.js';

const router = express.Router();

router.get('/offers', fetchOffers);

export default router;
