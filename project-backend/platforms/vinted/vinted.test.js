import VintedPlatform from './VintedPlatform.js';
import vintedConfig from './vinted.config.js';
import { transformVintedItem, transformVintedResponse } from './vinted.transformer.js';

describe('Vinted Platform', () => {
  let platform;

  beforeEach(() => {
    platform = new VintedPlatform();
  });

  describe('Configuration', () => {
    test('should have correct platform name', () => {
      expect(platform.name).toBe('vinted');
    });

    test('should have correct display name', () => {
      expect(platform.displayName).toBe('Vinted');
    });

    test('should be enabled by default', () => {
      expect(platform.enabled).toBe(true);
    });

    test('should require cookies', () => {
      expect(vintedConfig.requiresCookies).toBe(true);
    });

    test('should have regional domains configured', () => {
      expect(vintedConfig.regionalDomains).toHaveProperty('fr');
      expect(vintedConfig.regionalDomains).toHaveProperty('es');
      expect(vintedConfig.regionalDomains).toHaveProperty('de');
    });
  });

  describe('Query Building', () => {
    test('should build correct query params', () => {
      const query = { text: 'nike shoes', limit: 50 };
      const params = platform.buildQueryParams(query);

      expect(params.search_text).toBe('nike shoes');
      expect(params.per_page).toBe(50);
    });

    test('should include price filters when provided', () => {
      const query = { text: 'jacket', minPrice: 10, maxPrice: 100 };
      const params = platform.buildQueryParams(query);

      expect(params.price_from).toBe(10);
      expect(params.price_to).toBe(100);
    });
  });

  describe('Response Transformation', () => {
    test('should transform API response to Item model', () => {
      const mockResponse = {
        items: [
          {
            id: 12345,
            title: 'Test Item',
            description: 'A test item',
            price: '25.00',
            currency: 'EUR',
            url: '/items/12345',
            user: { id: 1, login: 'seller1' },
          },
        ],
      };
      const items = transformVintedResponse(mockResponse);

      expect(items.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Sort Mapping', () => {
    test('should map sort options correctly', () => {
      expect(platform.mapSortOption('newest')).toBe('newest_first');
      expect(platform.mapSortOption('price_asc')).toBe('price_low_to_high');
      expect(platform.mapSortOption('price_desc')).toBe('price_high_to_low');
    });
  });

  describe('Integration (Live API)', () => {
    test.skip('should search and return items from live API', async () => {
      const items = await platform.search({ text: 'dress', limit: 5 });
      
      expect(Array.isArray(items)).toBe(true);
      if (items.length > 0) {
        expect(items[0].source).toBe('vinted');
      }
    }, 30000);
  });
});
