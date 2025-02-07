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
        };

        const wishlist = req.query.wishlist ? req.query.wishlist.split(',') : [];
        const filtered = req.query.filtered ? req.query.filtered.split(',') : [];

        const fullResponse = await fetchOlxOffers(queryParams);
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
                createdTime: offer.created_time,
                isOnWishlist: isItemOnWishlist(offer.title, offer.description, wishlist),
            });
        });

        const filteredItems = filterItems(items, filtered);

        if (resOrOptions.json === false) {
            return filteredItems;
        }

        resOrOptions.status(200).json({
            success: true,
            data: filteredItems,
        });
    } catch (error) {
        console.error("Error fetching OLX offers:", error.message);
        throw new Error("Failed to fetch data from OLX.");
    }
};
