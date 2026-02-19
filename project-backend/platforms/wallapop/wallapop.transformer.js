import Item from '../../models/Item.js';

/**
 * Transform Wallapop API response to Item model
 */
export function transformWallapopItem(item) {
  const photos = [];
  
  if (item.images && Array.isArray(item.images)) {
    item.images.forEach(img => {
      if (img.original) photos.push(img.original);
      else if (img.large) photos.push(img.large);
      else if (img.medium) photos.push(img.medium);
      else if (img.small) photos.push(img.small);
      else if (img.xlarge) photos.push(img.xlarge);
      else if (typeof img === 'string') photos.push(img);
    });
  }

  // Parse price
  let price = null;
  let currency = 'EUR';
  if (item.price) {
    price = typeof item.price === 'object' ? item.price.amount : parseFloat(item.price);
    currency = item.price?.currency || item.currency || 'EUR';
  }

  // Parse location
  let location = null;
  if (item.location) {
    location = item.location.city || item.location.postal_code || null;
  }

  // Map condition
  const conditionMap = {
    'new': 'New',
    'as_good_as_new': 'As good as new',
    'good': 'Good',
    'fair': 'Fair',
    'has_given_it_all': 'Has given it all',
  };

  return new Item({
    externalId: item.id?.toString(),
    url: item.web_slug ? `https://es.wallapop.com/item/${item.web_slug}` : `https://es.wallapop.com/item/${item.id}`,
    title: item.title,
    description: item.description || item.storytelling || '',
    category: item.category_id ? `Category ${item.category_id}` : null,
    price: price,
    currency: currency,
    shipping: item.shipping?.item_is_shippable ? { available: true } : null,
    condition: conditionMap[item.flags?.condition] || item.condition || null,
    location: location,
    seller: item.user ? {
      id: item.user.id,
      name: item.user.micro_name,
      image: item.user.image?.original,
      isPro: item.user.kind === 'professional',
    } : null,
    createdTime: item.creation_date || item.publish_date || null,
    updatedTime: item.modification_date || null,
    source: 'wallapop',
    sourceRegion: 'es',
    photos: photos,
    attributes: {
      favorites: item.favorites || 0,
      views: item.views || 0,
      reserved: item.flags?.reserved || false,
      sold: item.flags?.sold || false,
      bumped: item.flags?.bumped || false,
    },
  });
}

export function transformWallapopResponse(data) {
  // Wallapop returns data in search_objects array
  const items = data.search_objects || data.data || data || [];
  return items.map(transformWallapopItem).filter(item => item.isValid());
}

export default { transformWallapopItem, transformWallapopResponse };
