import OlxPlPlatform from '../../platforms/olx-pl/OlxPlPlatform.js';
import { transformOlxPlResponse } from '../../platforms/olx-pl/olx-pl.transformer.js';

describe('OLX Poland Platform', () => {
  let platform;

  beforeEach(() => {
    platform = new OlxPlPlatform();
  });

  describe('Configuration', () => {
    test('should have correct platform name', () => {
      expect(platform.name).toBe('olx-pl');
    });

    test('should have correct display name', () => {
      expect(platform.displayName).toBe('OLX Poland');
    });

    test('should have PLN as currency', () => {
      expect(platform.currency).toBe('PLN');
    });

    test('should have Poland as country', () => {
      expect(platform.country).toBe('Poland');
    });

    test('should have pl as region', () => {
      expect(platform.region).toBe('pl');
    });
  });

  describe('Query Building', () => {
    test('should build correct query params', () => {
      const query = { text: 'telefon', limit: 30 };
      const params = platform.buildQueryParams(query);

      expect(params.query).toBe('telefon');
      expect(params.limit).toBe(30);
    });
  });

  describe('Response Transformation', () => {
    test('should transform response with PLN currency', () => {
      const mockResponse = {
        data: [{
          id: 67890,
          url: 'https://www.olx.pl/item/67890',
          title: 'Laptop używany',
          params: [{ key: 'price', value: { value: 2500, currency: 'PLN' } }],
          photos: [],
          location: { city: { name: 'Warszawa' }, region: { name: 'Mazowieckie' } },
        }]
      };
      
      const items = transformOlxPlResponse(mockResponse);

      expect(items).toHaveLength(1);
      expect(items[0].source).toBe('olx-pl');
      expect(items[0].sourceRegion).toBe('pl');
      expect(items[0].currency).toBe('PLN');
    });
  });

  describe('Integration (Live API)', () => {
    test.skip('should search and return items from live API', async () => {
      const items = await platform.search({ text: 'komputer', limit: 5 });
      
      expect(Array.isArray(items)).toBe(true);
      if (items.length > 0) {
        expect(items[0].source).toBe('olx-pl');
      }
    }, 30000);
  });
});
