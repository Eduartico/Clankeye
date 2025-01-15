const { fetchOlxOffers } = require('../services/olxService');
const { saveToFile } = require('../utils/fileHandler');
const Item = require('../models/item');

const FILE_PATH = './data/offers.txt';

const fetchOffers = async (req, res) => {
    try {
        const fullResponse = await fetchOlxOffers(req.query);

        const rawItems = fullResponse.data || [];

        const items = rawItems.map((offer) => {
            const priceParam = offer.params?.find((param) => param.key === 'price')?.value || {};

            return new Item({
                id: offer.id,
                url: offer.url,
                title: offer.title,
                description: offer.description,
                price: priceParam.value ?? null,
                currency: priceParam.currency ?? null,
                negotiable: priceParam.negotiable ?? false,
                createdTime: offer.created_time,
                lastRefreshTime: offer.last_refresh_time,
                validToTime: offer.valid_to_time,
                isHighlighted: offer.promotion?.highlighted ?? false,
                isUrgent: offer.promotion?.urgent ?? false,
                isTopAd: offer.promotion?.top_ad ?? false,
                business: offer.business,
            });
        });

        saveToFile(FILE_PATH, JSON.stringify(items));

        res.status(200).json({
            success: true,
            data: items,
        });
    } catch (error) {
        console.error('Error fetching offers:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    fetchOffers,
};
