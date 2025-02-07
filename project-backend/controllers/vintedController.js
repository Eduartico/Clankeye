export const fetchVintedOffers = async (req, resOrOptions) => {
  try {
      const queryParams = {
          text: req.query.text || 'clone wars',
          currency: req.query.currency || 'EUR',
          order: req.query.order || 'newest_first',
      };

      const wishlist = req.query.wishlist ? req.query.wishlist.split(',') : [];
      const filtered = req.query.filtered ? req.query.filtered.split(',') : [];

      const rawItems = await searchVintedItems(queryParams);

      const items = rawItems.map((vintedItem) => new Item({
          id: vintedItem.id,
          url: vintedItem.url,
          title: vintedItem.itemTitle,
          description: '',
          price: vintedItem.itemPrice,
          currency: queryParams.currency,
          createdTime: vintedItem.timestamp,
          isOnWishlist: isItemOnWishlist(vintedItem.itemTitle, '', wishlist),
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
