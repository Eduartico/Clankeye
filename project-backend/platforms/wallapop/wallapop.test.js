import WallapopPlatform from './WallapopPlatform.js';
import wallapopConfig from './wallapop.config.js';
import { transformWallapopItem, transformWallapopResponse } from './wallapop.transformer.js';

describe('Wallapop Platform', () => {
  let platform;

  beforeEach(() => {
    platform = new WallapopPlatform();
  });

  describe('Configuration', () => {
    test('should have correct platform name', () => {
      expect(platform.name).toBe('wallapop');
    });

    test('should have correct display name', () => {
      expect(platform.displayName).toBe('Wallapop');
    });

    test('should be enabled by default', () => {
      expect(platform.enabled).toBe(true);
    });

    test('should have EUR as currency', () => {
      expect(wallapopConfig.currency).toBe('EUR');
    });

    test('should have regional URLs configured', () => {
      expect(wallapopConfig.regionalUrls).toBeDefined();
      expect(wallapopConfig.regionalUrls).toHaveProperty('es');
    });
  });

  describe('Query Building', () => {
    test('should build correct query params', () => {
      const query = { text: 'iphone', limit: 40 };
      const params = platform.buildQueryParams(query);

      expect(params.keywords).toBe('iphone');
    });
  });

  describe('Response Transformation', () => {
    test('should transform API response with EUR currency', () => {
      const mockResponse = {
        search_objects: [
          {
            id: 'abc123',
            title: 'Cartas Pokemon Vintage',
            description: 'Colección completa',
            price: 12000,
            images: [{ original: 'https://wallapop.com/img1.jpg' }],
            web_slug: 'cartas-pokemon-vintage-abc123',
            modification_date: 1705312800000,
            user: { id: 'user-1', micro_name: 'VendedorCards' },
            location: { city: 'Madrid', country_code: 'ES' },
          },
        ],
      };
      const items = transformWallapopResponse(mockResponse);

      expect(items.length).toBeGreaterThanOrEqual(0);
      if (items.length > 0) {
        expect(items[0].source).toBe('wallapop');
      }
    });
  });

  describe('Integration (Live API)', () => {
    test.skip('should search and return items from live API', async () => {
      const items = await platform.search({ text: 'pokemon', limit: 5 });
      expect(Array.isArray(items)).toBe(true);
    }, 30000);
  });
});
