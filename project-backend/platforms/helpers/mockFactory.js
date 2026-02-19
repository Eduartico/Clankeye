/**
 * Mock Factory - Helper utilities for platform testing
 * Creates standardized mock data for platform tests
 */

import SearchQuery from '../../models/SearchQuery.js';
import Item from '../../models/item.js';

/**
 * Create a mock SearchQuery
 * @param {Object} overrides - Properties to override
 * @returns {SearchQuery}
 */
export function createMockSearchQuery(overrides = {}) {
  const defaults = {
    text: 'pokemon cards',
    limit: 20,
    offset: 0,
    page: 1,
    sort: 'relevance',
    minPrice: null,
    maxPrice: null,
    currency: 'EUR',
    condition: null,
    category: null,
    location: null,
    filters: {},
  };

  return new SearchQuery({ ...defaults, ...overrides });
}

/**
 * Create a mock Item
 * @param {Object} overrides - Properties to override
 * @returns {Item}
 */
export function createMockItem(overrides = {}) {
  const defaults = {
    id: '123456',
    externalId: 'ext-123456',
    title: 'Vintage Pokemon Cards Collection',
    description: 'A collection of vintage Pokemon cards in excellent condition.',
    price: 150.00,
    originalPrice: 180.00,
    currency: 'EUR',
    image: 'https://example.com/image.jpg',
    images: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    url: 'https://example.com/listing/123456',
    platform: 'test-platform',
    timestamp: new Date().toISOString(),
    updatedTime: new Date().toISOString(),
    condition: 'used',
    location: 'Lisboa, Portugal',
    seller: {
      id: 'seller-123',
      name: 'CollectorJoe',
      rating: 4.8,
      verified: true,
    },
    shipping: {
      available: true,
      price: 5.00,
      method: 'standard',
    },
    category: 'collectibles',
    subcategory: 'trading-cards',
    sourceRegion: 'pt',
    attributes: {
      brand: 'Pokemon',
      year: '1999',
    },
  };

  return new Item({ ...defaults, ...overrides });
}

/**
 * Validate that an item has all required properties
 * @param {Object} item - The item to validate
 * @returns {boolean} True if valid
 */
export function validateItem(item) {
  const requiredFields = ['id', 'title', 'price', 'currency', 'platform', 'url'];
  
  for (const field of requiredFields) {
    if (item[field] === undefined || item[field] === null) {
      return false;
    }
  }
  
  // Validate price is a number
  if (typeof item.price !== 'number' || isNaN(item.price)) {
    return false;
  }
  
  // Validate currency is a string
  if (typeof item.currency !== 'string') {
    return false;
  }
  
  return true;
}

/**
 * Create mock OLX API response
 */
export function createMockOlxResponse() {
  return {
    data: [
      {
        id: 123456,
        title: 'Pokemon Cards',
        description: 'Vintage collection',
        params: [
          { key: 'price', value: { value: 150 } },
        ],
        photos: ['https://olx.com/img1.jpg'],
        url: 'https://olx.pt/item/123456',
        created_time: '2024-01-15T10:00:00Z',
        location: { city: { name: 'Lisboa' } },
        user: { id: 'user-1', name: 'Seller' },
      },
    ],
    metadata: {
      total_elements: 100,
    },
  };
}

/**
 * Create mock Vinted API response
 */
export function createMockVintedResponse() {
  return {
    items: [
      {
        id: 789012,
        title: 'Pokemon Trading Cards',
        description: 'Rare cards',
        price: { amount: '75.00', currency_code: 'EUR' },
        photos: [{ url: 'https://vinted.com/img1.jpg' }],
        url: '/items/789012',
        created_at_ts: 1705312800,
        user: { id: 123, login: 'CardTrader' },
        city: 'Paris',
        country_title: 'France',
      },
    ],
    pagination: {
      total_entries: 50,
    },
  };
}

/**
 * Create mock eBay API response
 */
export function createMockEbayResponse() {
  return {
    itemSummaries: [
      {
        itemId: 'v1|123456789|0',
        title: 'Pokemon Base Set Charizard',
        price: { value: '250.00', currency: 'USD' },
        image: { imageUrl: 'https://ebay.com/img1.jpg' },
        itemWebUrl: 'https://ebay.com/itm/123456789',
        condition: 'Used',
        seller: { username: 'CardKing', feedbackPercentage: '99.5' },
        itemLocation: { city: 'New York', country: 'US' },
        shippingOptions: [{ shippingCost: { value: '5.00' } }],
      },
    ],
    total: 200,
  };
}

/**
 * Create mock Wallapop API response
 */
export function createMockWallapopResponse() {
  return {
    search_objects: [
      {
        id: 'abc123',
        title: 'Cartas Pokemon Vintage',
        description: 'Colección completa',
        price: 12000, // In cents
        images: [{ original: 'https://wallapop.com/img1.jpg' }],
        web_slug: 'cartas-pokemon-vintage-abc123',
        modification_date: 1705312800000,
        user: { id: 'user-1', micro_name: 'VendedorCards' },
        location: { city: 'Madrid', country_code: 'ES' },
        flags: { reserved: false, sold: false },
      },
    ],
  };
}

/**
 * Create mock Todo Coleccion API response
 */
export function createMockTodocoleccionResponse() {
  return {
    items: [
      {
        id: 'tc-123456',
        titulo: 'Pokemon Primera Edición',
        descripcion: 'Cartas originales japonesas',
        precio: 350.00,
        imagenes: ['https://todocoleccion.com/img1.jpg'],
        url_detalle: '/articulos/tc-123456',
        fecha_alta: '2024-01-15',
        vendedor: { nombre: 'ColeccionistaVIP', valoracion: 5 },
        ubicacion: 'Barcelona, España',
        categoria: 'Trading Cards',
      },
    ],
    total: 75,
  };
}

/**
 * Create mock Leboncoin API response
 */
export function createMockLeboncoinResponse() {
  return {
    ads: [
      {
        list_id: 987654,
        subject: 'Collection Cartes Pokemon',
        body: 'Grande collection de cartes',
        price: [200],
        images: { urls: ['https://leboncoin.com/img1.jpg'] },
        url: 'https://leboncoin.fr/ad/987654',
        first_publication_date: '2024-01-15T10:00:00Z',
        owner: { user_id: 'lbc-user-1', name: 'VendeurCards' },
        location: { city: 'Lyon', region_name: 'Rhône-Alpes' },
        category_id: '27', // Games category
      },
    ],
    total: 150,
  };
}

/**
 * Create mock API responses for different platforms (combined)
 */
export const mockResponses = {
  olx: createMockOlxResponse(),
  vinted: createMockVintedResponse(),
  ebay: createMockEbayResponse(),
  wallapop: createMockWallapopResponse(),
  todocoleccion: createMockTodocoleccionResponse(),
  leboncoin: createMockLeboncoinResponse(),
};

/**
 * Create a mock HTTP client
 * @param {Object} response - The response to return
 * @returns {Object} Mock http client
 */
export function createMockHttpClient(response) {
  return {
    get: jest.fn().mockResolvedValue(response),
    post: jest.fn().mockResolvedValue(response),
    withCookies: jest.fn().mockReturnThis(),
    withRetry: jest.fn().mockReturnThis(),
  };
}

export default {
  createMockSearchQuery,
  createMockItem,
  validateItem,
  createMockOlxResponse,
  createMockVintedResponse,
  createMockEbayResponse,
  createMockWallapopResponse,
  createMockTodocoleccionResponse,
  createMockLeboncoinResponse,
  mockResponses,
  createMockHttpClient,
};
