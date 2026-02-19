import Item from '../../models/Item.js';

/**
 * Transform Leboncoin API response to Item model
 */
export function transformLeboncoinItem(item) {
  const photos = [];
  
  // Handle images array
  if (item.images?.urls) {
    photos.push(...item.images.urls);
  } else if (item.images && Array.isArray(item.images)) {
    item.images.forEach(img => {
      if (img.url) photos.push(img.url);
      else if (typeof img === 'string') photos.push(img);
    });
  }

  // If no array, check for thumb_url or image_url
  if (photos.length === 0) {
    if (item.images?.thumb_url) photos.push(item.images.thumb_url);
    if (item.images?.small_url) photos.push(item.images.small_url);
  }

  // Parse price
  let price = null;
  if (item.price && item.price[0]) {
    price = item.price[0];
  } else if (typeof item.price === 'number') {
    price = item.price;
  }

  // Parse location
  let location = null;
  if (item.location) {
    const parts = [];
    if (item.location.city) parts.push(item.location.city);
    if (item.location.zipcode) parts.push(item.location.zipcode);
    if (item.location.region_name) parts.push(item.location.region_name);
    location = parts.join(', ');
  }

  // Parse attributes
  const attributes = {};
  if (item.attributes && Array.isArray(item.attributes)) {
    item.attributes.forEach(attr => {
      attributes[attr.key] = attr.value_label || attr.value;
    });
  }

  // Determine condition from attributes
  const condition = attributes.item_condition || attributes.state || null;

  return new Item({
    externalId: item.list_id?.toString() || item.ad_id?.toString(),
    url: item.url || `https://www.leboncoin.fr/ad/${item.list_id}`,
    title: item.subject || item.title || '',
    description: item.body || item.description || '',
    category: item.category_name || item.category?.name || null,
    price: price,
    currency: 'EUR',
    shipping: item.has_shipping ? { available: true } : null,
    condition: condition,
    location: location,
    seller: item.owner ? {
      id: item.owner.store_id || item.owner.user_id,
      name: item.owner.name,
      type: item.owner.type, // 'private' or 'pro'
      verified: item.owner.verified || false,
    } : null,
    createdTime: item.first_publication_date || item.index_date,
    updatedTime: item.index_date,
    source: 'leboncoin',
    sourceRegion: 'fr',
    photos: photos,
    attributes: {
      ...attributes,
      urgent: item.options?.urgent || false,
      highlight: item.options?.highlight || false,
    },
  });
}

export function transformLeboncoinResponse(data) {
  const items = data.ads || data.results || data || [];
  return items.map(transformLeboncoinItem).filter(item => item.isValid());
}

export default { transformLeboncoinItem, transformLeboncoinResponse };
