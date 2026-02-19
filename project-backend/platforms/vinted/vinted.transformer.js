import Item from '../../models/Item.js';

/**
 * Transform Vinted API response to Item model
 */
export function transformVintedItem(item) {
  const photos = [];
  
  // Handle different photo formats
  if (item.photo) {
    if (item.photo.url) photos.push(item.photo.url);
    if (item.photo.full_size_url) photos.push(item.photo.full_size_url);
  }
  
  if (item.photos && Array.isArray(item.photos)) {
    item.photos.forEach(photo => {
      if (photo.url) photos.push(photo.url);
      else if (photo.full_size_url) photos.push(photo.full_size_url);
    });
  }

  // Determine condition
  let condition = null;
  if (item.status) {
    const statusMap = {
      '1': 'New with tags',
      '2': 'New without tags', 
      '3': 'Very good',
      '4': 'Good',
      '5': 'Satisfactory',
    };
    condition = statusMap[item.status] || item.status;
  }

  return new Item({
    externalId: item.id?.toString(),
    url: item.url || `https://www.vinted.fr/items/${item.id}`,
    title: item.title,
    description: item.description || '',
    category: item.catalog_id ? `Category ${item.catalog_id}` : null,
    price: item.price ? parseFloat(item.price) : null,
    originalPrice: item.original_price ? parseFloat(item.original_price) : null,
    currency: item.currency || 'EUR',
    shipping: item.service_fee ? parseFloat(item.service_fee) : null,
    condition: condition,
    location: item.city || item.country_title || null,
    seller: item.user ? {
      id: item.user.id,
      name: item.user.login,
      rating: item.user.feedback_reputation,
      verified: item.user.verification?.email?.valid || false,
    } : null,
    createdTime: item.created_at_ts ? new Date(item.created_at_ts * 1000).toISOString() : null,
    updatedTime: item.updated_at_ts ? new Date(item.updated_at_ts * 1000).toISOString() : null,
    source: 'vinted',
    sourceRegion: 'fr',
    photos: [...new Set(photos)], // Remove duplicates
    attributes: {
      brand: item.brand_title || null,
      size: item.size_title || null,
      color: item.color1 || item.color1_id || null,
      material: item.material_id || null,
      favourite_count: item.favourite_count || 0,
      view_count: item.view_count || 0,
    },
  });
}

export function transformVintedResponse(data) {
  const items = data.items || data || [];
  return items.map(transformVintedItem).filter(item => item.isValid());
}

export default { transformVintedItem, transformVintedResponse };
