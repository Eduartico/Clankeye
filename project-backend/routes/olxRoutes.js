const express = require('express');
const { fetchOffers } = require('../controllers/olxController');

const router = express.Router();

router.get('/offers', fetchOffers);

module.exports = router;
