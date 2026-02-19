/**
 * Test utilities and mock factories for platform testing
 */

/**
 * Create mock OLX response data
 */
export function createMockOlxResponse(count = 5) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: 1000 + i,
      url: `https://www.olx.pt/d/anuncio/test-item-${i}-IDabcd${i}.html`,
      title: `Test Item ${i}`,
      description: `Description for test item ${i}`,
      created_time: new Date().toISOString(),
      last_refresh_time: new Date().toISOString(),
      params: [
        { key: 'price', value: { value: 100 + i * 10, currency: 'EUR', negotiable: false } },
        { key: 'state', value: { label: 'Used' } },
      ],
      photos: [
        { link: `https://ireland.apollo.olxcdn.com/v1/files/test${i}.jpg/image;s=800x600`, width: 800, height: 600 },
      ],
      location: {
        city: { name: 'Lisboa' },
        region: { name: 'Lisboa' },
      },
      user: {
        id: 100 + i,
        name: `Seller ${i}`,
        verified: true,
      },
      category: { name: 'Electronics' },
    });
  }
  return { data: items };
}

/**
 * Create mock Vinted response data
 */
export function createMockVintedResponse(count = 5) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: 2000 + i,
      title: `Vinted Item ${i}`,
      description: `Vinted description ${i}`,
      price: (50 + i * 5).toString(),
      currency: 'EUR',
      url: `https://www.vinted.fr/items/${2000 + i}`,
      photo: {
        url: `https://images.vinted.net/item${i}.jpg`,
        full_size_url: `https://images.vinted.net/item${i}_full.jpg`,
      },
      status: '3',
      city: 'Paris',
      country_title: 'France',
      user: {
        id: 200 + i,
        login: `vintedseller${i}`,
        feedback_reputation: 4.8,
      },
      brand_title: 'Nike',
      size_title: 'M',
      created_at_ts: Math.floor(Date.now() / 1000),
      favourite_count: 10 + i,
    });
  }
  return { items };
}

/**
 * Create mock eBay response data
 */
export function createMockEbayResponse(count = 5) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      itemId: `v1|${3000 + i}|0`,
      title: `eBay Item ${i}`,
      shortDescription: `eBay description ${i}`,
      price: { value: (75 + i * 15).toString(), currency: 'USD' },
      itemWebUrl: `https://www.ebay.com/itm/${3000 + i}`,
      image: { imageUrl: `https://i.ebayimg.com/images/g/item${i}.jpg` },
      condition: 'USED_VERY_GOOD',
      itemLocation: { city: 'New York', stateOrProvince: 'NY', country: 'US' },
      seller: { username: `ebayseller${i}`, feedbackPercentage: 99.5, feedbackScore: 1000 + i },
      categories: [{ categoryName: 'Collectibles' }],
      buyingOptions: ['FIXED_PRICE'],
      shippingOptions: [{ shippingCost: { value: '5.99', currency: 'USD' } }],
    });
  }
  return { itemSummaries: items };
}

/**
 * Create mock Wallapop response data
 */
export function createMockWallapopResponse(count = 5) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `4000${i}`,
      title: `Wallapop Item ${i}`,
      description: `Wallapop description ${i}`,
      price: { amount: 60 + i * 8, currency: 'EUR' },
      web_slug: `wallapop-item-${i}-4000${i}`,
      images: [{ original: `https://cdn.wallapop.com/images/item${i}.jpg` }],
      location: { city: 'Madrid' },
      user: { id: 400 + i, micro_name: `wpseller${i}`, kind: 'private' },
      flags: { condition: 'good', reserved: false, sold: false },
      creation_date: new Date().toISOString(),
      favorites: 5 + i,
    });
  }
  return { search_objects: items };
}

/**
 * Create mock Leboncoin response data
 */
export function createMockLeboncoinResponse(count = 5) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      list_id: 5000 + i,
      subject: `Leboncoin Item ${i}`,
      body: `Leboncoin description ${i}`,
      price: [80 + i * 12],
      url: `https://www.leboncoin.fr/ad/${5000 + i}`,
      images: { urls: [`https://img.leboncoin.fr/ad-image/${5000 + i}.jpg`] },
      location: { city: 'Lyon', zipcode: '69000', region_name: 'Rhône-Alpes' },
      owner: { store_id: 500 + i, name: `lbcseller${i}`, type: 'private' },
      category_name: 'Maison',
      first_publication_date: new Date().toISOString(),
      attributes: [{ key: 'item_condition', value_label: 'Bon état' }],
    });
  }
  return { ads: items };
}

/**
 * Create mock Todo Coleccion response data
 */
export function createMockTodocoleccionResponse(count = 5) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: 6000 + i,
      lote: `TC${6000 + i}`,
      titulo: `Todo Coleccion Item ${i}`,
      descripcion: `Todo Coleccion description ${i}`,
      precio: `${40 + i * 6},00`,
      url: `/lote/todo-coleccion-item-${i}-tc${6000 + i}`,
      imagen: `https://www.todocoleccion.net/images/tc${6000 + i}.jpg`,
      categoria: 'Coleccionismo',
      vendedor: `tcseller${i}`,
      vendedor_id: 600 + i,
      fecha_inicio: new Date().toISOString(),
      tipo: 'precio_fijo',
      estado: 'Usado',
    });
  }
  return { resultados: items };
}

/**
 * Utility to wait for async operations
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test helper to check if item has required fields
 */
export function validateItem(item) {
  const requiredFields = ['id', 'title', 'source', 'url'];
  const missingFields = requiredFields.filter(field => !item[field]);
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

export default {
  createMockOlxResponse,
  createMockVintedResponse,
  createMockEbayResponse,
  createMockWallapopResponse,
  createMockLeboncoinResponse,
  createMockTodocoleccionResponse,
  wait,
  validateItem,
};
