import Item from '../../models/Item.js';

/**
 * Transform OLX Poland API response to Item model
 */
export function transformOlxPlItem(offer) {
  const priceParam = offer.params?.find((param) => param.key === 'price')?.value || {};
  
  const photos = (offer.photos || []).map((photo) => {
    let link = photo.link || photo.original || photo.url;
    if (link && !link.includes('/image;s=')) {
      link = link.split('/').slice(0, -1).join('/');
      link += '/image;s=' + (photo.width || 800) + 'x' + (photo.height || 600);
    }
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
    currency: priceParam.currency || 'PLN',
    condition: offer.params?.find(p => p.key === 'state')?.value?.label || null,
    location: location,
    seller: offer.user ? {
      id: offer.user.id,
      name: offer.user.name,
      verified: offer.user.verified || false,
    } : null,
    createdTime: offer.created_time,
    updatedTime: offer.last_refresh_time,
    source: 'olx-pl',
    sourceRegion: 'pl',
    photos,
    attributes: {
      promoted: offer.promotion?.highlighted || false,
      negotiable: priceParam.negotiable || false,
    },
  });
}

export function transformOlxPlResponse(data) {
  const items = data.data || data || [];
  return items.map(transformOlxPlItem).filter(item => item.isValid());
}

export default { transformOlxPlItem, transformOlxPlResponse };
