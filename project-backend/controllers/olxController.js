import { fetchOlxOffers } from "../services/olxService.js";
import Item from "../models/item.js";

export const fetchOffers = async (req, res) => {
  try {
    const queryParams = {
      offset: req.query.offset || 0,
      limit: req.query.limit || 30,
      query: req.query.query || "",
      sort_by: req.query.sort_by || "created_at:desc",
      filter_refiners: req.query.filter_refiners || "spell_checker",
      suggest_filters: req.query.suggest_filters || "true",
      sl: req.query.sl || "194cde7fdb1x64d67f04",
    };

    const fullResponse = await fetchOlxOffers(queryParams);

    const rawItems = fullResponse.data || [];

    const items = rawItems.map((offer) => {
      const priceParam =
        offer.params?.find((param) => param.key === "price")?.value || {};
      const images =
        offer.photos?.map((photo) => {
          const link = formatImgLink(photo);
          return link;
        }) || [];

      return new Item({
        id: offer.id,
        url: offer.url,
        title: offer.title,
        description: offer.description,
        price: priceParam.value ?? null,
        currency: priceParam.currency ?? null,
        createdTime: offer.created_time,
        isOnWishlist: false, //todo: implement this feature // hell naww 😭
        imgLink: images.length > 0 && images[0],
      });
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Error fetching offers:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const formatImgLink = (img) => {
  // get everything before the last "="
  let link = img.link.split("=").slice(0, -1).join("=");
  link += "=" + img.width + "x" + img.height;
  return link;
};
