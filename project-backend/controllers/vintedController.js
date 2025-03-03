import { fetchVintedOffersService } from '../services/vintedService.js';
import Item from '../models/item.js';
import {isItemOnWishlist, filterItems} from '../utils/itemUtils.js';

export const fetchVintedOffers = async (req, resOrOptions) => {
  try {
      const queryParams = {
          text: req.query.text || 'clone wars',
          currency: req.query.currency || 'EUR',
          order: req.query.order || 'newest_first',
      };

      const wishlist = req.query.wishlist ? req.query.wishlist.split(',') : [];
      const filtered = req.query.filtered ? req.query.filtered.split(',') : [];

      const rawItems = await fetchVintedOffersService(queryParams);

      const items = rawItems.map((vintedItem) => new Item({
        id: vintedItem.id,
        url: vintedItem.url,
        title: vintedItem.title,
        description: '',
        price: vintedItem.total_item_price.amount,
        currency: vintedItem.total_item_price.currency_code,
        createdTime: vintedItem.photo?.high_resolution?.timestamp || null,
        photos: vintedItem.photo ? [
            vintedItem.photo.full_size_url || vintedItem.photo.url,
            ...(vintedItem.photo.thumbnails ? vintedItem.photo.thumbnails.map(thumbnail => thumbnail.url) : [])
          ] : [],
        source: "vinted",
        category: '',
        isOnWishlist: isItemOnWishlist(vintedItem.itemTitle, vintedItem.description, vintedItem.category, wishlist),
      }));

      const filteredItems = filterItems(items, filtered);

      if (resOrOptions.json === false) {
          return filteredItems;
      }

      resOrOptions.status(200).json({
          success: true,
          data: filteredItems,
      });
  } catch (error) {
      console.error('Error fetching Vinted offers:', error.message);
      resOrOptions.status(500).json({ success: false, error: error.message });
  }
};
