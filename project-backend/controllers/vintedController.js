import { searchVintedItems } from '../services/vintedService.js';
import Item from '../models/item.js';

export const fetchVintedOffers = async (req, res) => {
  try {
    const queryParams = {
      text: req.query.text || '',
      currency: req.query.currency || 'EUR',
      order: req.query.order || 'newest_first'
    };

    const rawItems = await searchVintedItems(queryParams);

    const items = rawItems.map((vintedItem) => new Item({
      id: vintedItem.id,
      url: vintedItem.url,
      title: vintedItem.itemTitle,
      description: '', 
      price: vintedItem.itemPrice,
      currency: queryParams.currency,
      createdTime: vintedItem.timestamp,
      isOnWishlist: false // Placeholder
    }));

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching Vinted items:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
