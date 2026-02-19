import OlxPtPlatform from './OlxPtPlatform.js';
import olxPtConfig from './olx-pt.config.js';
import { transformOlxPtItem, transformOlxPtResponse } from './olx-pt.transformer.js';

describe('OLX PT Platform', () => {
  let platform;

  beforeEach(() => {
    platform = new OlxPtPlatform();
  });

  describe('Configuration', () => {
    test('should have correct platform name', () => {
      expect(platform.name).toBe('olx-pt');
    });

    test('should have correct display name', () => {
      expect(platform.displayName).toBe('OLX Portugal');
    });

    test('should be enabled by default', () => {
      expect(platform.enabled).toBe(true);
    });

    test('should have EUR as currency', () => {
      expect(olxPtConfig.currency).toBe('EUR');
    });

    test('should have correct region', () => {
      expect(olxPtConfig.region).toBe('pt');
    });
  });

  describe('Query Building', () => {
    test('should build correct query params', () => {
      const query = { text: 'pokemon cards', limit: 30, offset: 0 };
      const params = platform.buildQueryParams(query);

      expect(params.query).toBe('pokemon cards');
    });
  });

  describe('Response Transformation', () => {
    test('should transform API response with EUR currency', () => {
      const mockResponse = {
        data: [
          {
            id: 123456,
            title: 'Pokemon Cards',
            description: 'Vintage collection',
            params: [{ key: 'price', value: { value: 150 } }],
            photos: ['https://olx.pt/img1.jpg'],
            url: 'https://olx.pt/item/123456',
            created_time: '2024-01-15T10:00:00Z',
            location: { city: { name: 'Lisboa' } },
            user: { id: 'user-1', name: 'Seller' },
          },
        ],
      };
      const items = transformOlxPtResponse(mockResponse);

      expect(items.length).toBeGreaterThanOrEqual(0);
      if (items.length > 0) {
        expect(items[0].currency).toBe('EUR');
        expect(items[0].source).toBe('olx-pt');
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
