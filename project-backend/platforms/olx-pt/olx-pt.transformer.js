import Item from '../../models/Item.js';

/**
 * Transform OLX PT API response to Item model
 */
export function transformOlxPtItem(offer) {
  const priceParam = offer.params?.find((param) => param.key === 'price')?.value || {};
  
  const photos = (offer.photos || []).map((photo) => {
    // Handle both string photos and object photos with link property
    if (typeof photo === 'string') {
      return photo;
    }
    if (!photo.link) {
      return null;
    }
    let link = photo.link.split('/').slice(0, -1).join('/');
    link += '/image;s=' + (photo.width || 800) + 'x' + (photo.height || 600);
    return link;
  }).filter(Boolean);

  const location = offer.location 
    ? `${offer.location.city?.name || ''}, ${offer.location.region?.name || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
    : null;

  return new Item({
    externalId: offer.id?.toString(),
    url: offer.url,
    title: offer.title,
    description: offer.description || '',
    category: offer.category?.name || null,
    price: priceParam.value ?? null,
    currency: priceParam.currency || 'EUR',
    condition: offer.params?.find(p => p.key === 'state')?.value?.label || null,
    location: location,
    seller: offer.user ? {
      id: offer.user.id,
      name: offer.user.name,
      verified: offer.user.verified || false,
    } : null,
    createdTime: offer.created_time,
    updatedTime: offer.last_refresh_time,
    source: 'olx-pt',
    sourceRegion: 'pt',
    photos,
    attributes: {
      promoted: offer.promotion?.highlighted || false,
      negotiable: priceParam.negotiable || false,
    },
  });
}

/**
 * Transform array of OLX PT items
 */
export function transformOlxPtResponse(data) {
  const items = data.data || data || [];
  return items.map(transformOlxPtItem).filter(item => item.isValid());
}

export default { transformOlxPtItem, transformOlxPtResponse };
