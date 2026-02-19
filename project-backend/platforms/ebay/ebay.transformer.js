import Item from '../../models/Item.js';

/**
 * Transform eBay API response to Item model
 */
export function transformEbayItem(item) {
  const photos = [];
  
  if (item.image?.imageUrl) {
    photos.push(item.image.imageUrl);
  }
  
  if (item.additionalImages) {
    item.additionalImages.forEach(img => {
      if (img.imageUrl) photos.push(img.imageUrl);
    });
  }

  // Parse price
  let price = null;
  let currency = 'USD';
  if (item.price) {
    price = parseFloat(item.price.value);
    currency = item.price.currency;
  }

  // Parse condition
  const conditionMap = {
    'NEW': 'New',
    'LIKE_NEW': 'Like New',
    'NEW_OTHER': 'New Other',
    'NEW_WITH_DEFECTS': 'New with defects',
    'MANUFACTURER_REFURBISHED': 'Manufacturer Refurbished',
    'CERTIFIED_REFURBISHED': 'Certified Refurbished',
    'EXCELLENT_REFURBISHED': 'Excellent Refurbished',
    'VERY_GOOD_REFURBISHED': 'Very Good Refurbished',
    'GOOD_REFURBISHED': 'Good Refurbished',
    'SELLER_REFURBISHED': 'Seller Refurbished',
    'USED_EXCELLENT': 'Used - Excellent',
    'USED_VERY_GOOD': 'Used - Very Good',
    'USED_GOOD': 'Used - Good',
    'USED_ACCEPTABLE': 'Used - Acceptable',
    'FOR_PARTS_OR_NOT_WORKING': 'For parts or not working',
  };

  const condition = item.condition ? conditionMap[item.condition] || item.condition : null;

  // Parse location
  let location = null;
  if (item.itemLocation) {
    location = [item.itemLocation.city, item.itemLocation.stateOrProvince, item.itemLocation.country]
      .filter(Boolean)
      .join(', ');
  }

  // Parse shipping
  let shipping = null;
  if (item.shippingOptions?.[0]) {
    const shipOpt = item.shippingOptions[0];
    if (shipOpt.shippingCost) {
      shipping = {
        cost: parseFloat(shipOpt.shippingCost.value),
        currency: shipOpt.shippingCost.currency,
        type: shipOpt.shippingCostType,
      };
    }
  }

  return new Item({
    externalId: item.itemId,
    url: item.itemWebUrl || item.itemHref,
    title: item.title,
    description: item.shortDescription || '',
    category: item.categories?.[0]?.categoryName || null,
    price: price,
    originalPrice: item.marketingPrice?.originalPrice?.value ? parseFloat(item.marketingPrice.originalPrice.value) : null,
    currency: currency,
    shipping: shipping,
    condition: condition,
    location: location,
    seller: item.seller ? {
      name: item.seller.username,
      rating: item.seller.feedbackPercentage,
      feedbackScore: item.seller.feedbackScore,
    } : null,
    createdTime: item.itemCreationDate || null,
    updatedTime: item.itemEndDate || null,
    source: 'ebay',
    sourceRegion: 'us',
    photos: photos,
    attributes: {
      itemId: item.itemId,
      legacyItemId: item.legacyItemId,
      buyingOptions: item.buyingOptions || [],
      topRatedBuyingExperience: item.topRatedBuyingExperience || false,
      bidCount: item.bidCount,
      currentBidPrice: item.currentBidPrice?.value,
    },
  });
}

export function transformEbayResponse(data) {
  const items = data.itemSummaries || [];
  return items.map(transformEbayItem).filter(item => item.isValid());
}

export default { transformEbayItem, transformEbayResponse };
