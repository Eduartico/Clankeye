import { fetchOffers as fetchOlxOffers } from "./olxController.js";
import { fetchVintedOffers } from "./vintedController.js";

export const fetchAllOffers = async (req, res) => {
  try {
    const { platforms, query, wishlist, filtered } = req.query;

    if (!platforms) {
      // return res.status(400).json({ success: false, error: "No platforms selected." });
    }

    const selectedPlatforms = platforms
      ? platforms.split(",").map((p) => p.trim().toLowerCase())
      : ["olx", "vinted"];
    const queries = [];

    const queryParams = { query, wishlist, filtered };

    if (selectedPlatforms.includes("olx")) {
      const olxData = await fetchOlxOffers(
        { query: queryParams },
        { json: false }
      );
      queries.push(olxData);
    }

    if (selectedPlatforms.includes("vinted")) {
      const vintedData = await fetchVintedOffers(
        { query: queryParams },
        { json: false }
      );
      queries.push(vintedData);
    }

    const results = await Promise.all(queries);
    const combinedData = results.flat();

    res.status(200).json({
      success: true,
      data: combinedData,
    });
  } catch (error) {
    console.error("Error fetching all offers:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
