import Item from '../../models/Item.js';

/**
 * Transform Todo Coleccion item to Item model
 */
export function transformTodocoleccionItem(item) {
  const photos = [];
  
  // Handle image URLs
  if (item.imagen) {
    photos.push(item.imagen);
  }
  if (item.imagenes && Array.isArray(item.imagenes)) {
    item.imagenes.forEach(img => {
      if (img.url) photos.push(img.url);
      else if (typeof img === 'string') photos.push(img);
    });
  }

  // Parse price
  let price = null;
  if (item.precio) {
    price = parseFloat(item.precio.toString().replace(',', '.').replace(/[^\d.]/g, ''));
  } else if (item.precio_actual) {
    price = parseFloat(item.precio_actual.toString().replace(',', '.').replace(/[^\d.]/g, ''));
  }

  // Build URL
  let url = item.url || item.enlace;
  if (url && !url.startsWith('http')) {
    url = `https://www.todocoleccion.net${url}`;
  }

  return new Item({
    externalId: item.id?.toString() || item.lote?.toString(),
    url: url,
    title: item.titulo || item.nombre || '',
    description: item.descripcion || '',
    category: item.categoria || item.seccion || null,
    price: price,
    originalPrice: item.precio_salida ? parseFloat(item.precio_salida.toString().replace(',', '.')) : null,
    currency: 'EUR',
    condition: item.estado || null,
    location: item.pais || 'Spain',
    seller: item.vendedor ? {
      id: item.vendedor_id,
      name: item.vendedor,
      rating: item.valoracion_vendedor,
    } : null,
    createdTime: item.fecha_inicio || item.fecha || null,
    updatedTime: item.fecha_fin || null,
    source: 'todocoleccion',
    sourceRegion: 'es',
    photos: photos,
    attributes: {
      lote: item.lote,
      pujas: item.pujas || 0,
      tipo: item.tipo, // 'subasta' or 'precio_fijo'
      destacado: item.destacado || false,
      envio_gratis: item.envio_gratis || false,
    },
  });
}

export function transformTodocoleccionResponse(data) {
  // Handle different response formats
  let items = [];
  
  if (data.resultados) {
    items = data.resultados;
  } else if (data.items) {
    items = data.items;
  } else if (data.lotes) {
    items = data.lotes;
  } else if (Array.isArray(data)) {
    items = data;
  }

  return items.map(transformTodocoleccionItem).filter(item => item.isValid());
}

/**
 * Parse Todo Coleccion HTML search results
 * Used as fallback when API is not available
 */
export function parseHtmlResults(html) {
  const items = [];
  
  // Simple regex-based parsing for item cards
  const itemPattern = /<div[^>]*class="[^"]*item-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  const titlePattern = /<a[^>]*class="[^"]*title[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/i;
  const pricePattern = /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]*)<\/span>/i;
  const imagePattern = /<img[^>]*src="([^"]*)"[^>]*>/i;
  
  let match;
  while ((match = itemPattern.exec(html)) !== null) {
    const itemHtml = match[1];
    
    const titleMatch = titlePattern.exec(itemHtml);
    const priceMatch = pricePattern.exec(itemHtml);
    const imageMatch = imagePattern.exec(itemHtml);
    
    if (titleMatch) {
      items.push({
        url: titleMatch[1],
        titulo: titleMatch[2],
        precio: priceMatch ? priceMatch[1] : null,
        imagen: imageMatch ? imageMatch[1] : null,
      });
    }
  }
  
  return items.map(transformTodocoleccionItem).filter(item => item.isValid());
}

export default { transformTodocoleccionItem, transformTodocoleccionResponse, parseHtmlResults };
