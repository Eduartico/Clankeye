import { fetchOlxOffersService } from '../services/olxService.js';
import Item from '../models/item.js';

export const fetchOlxOffers = async (req, resOrOptions) => {
    try {
        const queryParams = {
            offset: req.query.offset || 0,
            limit: req.query.limit || 40,
            query: req.query.query || 'clone wars',
            sort_by: req.query.sort_by || 'created_at:desc',
            filter_refiners: req.query.filter_refiners || 'spell_checker',
            suggest_filters: req.query.suggest_filters || 'true',
            sl: req.query.sl || '194cde7fdb1x64d67f04',
            source: "olxpt",
        };

        const wishlist = req.query.wishlist ? req.query.wishlist.split(',') : [];
        const filtered = req.query.filtered ? req.query.filtered.split(',') : [];

        const fullResponse = await fetchOlxOffersService(queryParams);
        const rawItems = fullResponse.data || [];

        const items = rawItems.map(olxItem => {
            const priceParam = olxItem.params.find(param => param.key === 'price');
            const priceValue = priceParam ? priceParam.value.value : null;
            const currency = priceParam ? priceParam.value.currency : '';
        
            return new Item({
              id: olxItem.id,
              url: olxItem.url,
              title: olxItem.title,
              description: olxItem.description,
              price: priceValue,
              currency: currency,
              createdTime: olxItem.created_time,
              isOnWishlist: isItemOnWishlist(
                olxItem.title,
                olxItem.description,
                (olxItem.category && olxItem.category.type) || '',
                wishlist
              ),
              photos: olxItem.photos.map(photo => photo.link),
              category: (olxItem.category && olxItem.category.type) || ''
            });
          }
        );

        const filteredItems = filterItems(items, filtered);

        if (resOrOptions.json === false) {
            return filteredItems;
        }

        resOrOptions.status(200).json({
            success: true,
            data: filteredItems,
        });
    } catch (error) {
        //console.error("Error fetching OLX offers:", error.message);
        //throw new Error("Failed to fetch data from OLX.");
        //return;
    }
};
