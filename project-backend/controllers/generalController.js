import { fetchOlxOffers } from './olxController.js';
import { fetchVintedOffers } from './vintedController.js';

export const fetchAllOffers = async (req, res) => {
    try {
        const { platforms, query, wishlist, filtered } = req.query;

        if (!platforms) {
            return res.status(400).json({ success: false, error: "No platforms selected." });
        }

        const selectedPlatforms = platforms.split(',').map(p => p.trim().toLowerCase());
        const queries = [];

         const queryParams = { query, wishlist, filtered };

        if (selectedPlatforms.includes('olx')) {
            queries.push(fetchOlxOffers({ query: queryParams, json: false }));
        }

        if (selectedPlatforms.includes('vinted')) {
            queries.push(fetchVintedOffers({ query: queryParams, json: false }));
        }

        const results = await Promise.all(queries);
        const combinedData = results.flat();

        res.status(200).json({
            success: true,
            data: combinedData,
        });
    } catch (error) {
        console.error('Error fetching all offers:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
