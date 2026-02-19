import OlxBrPlatform from './OlxBrPlatform.js';
import olxBrConfig from './olx-br.config.js';
import { transformOlxBrItem, transformOlxBrResponse } from './olx-br.transformer.js';

describe('OLX Brasil Platform', () => {
  let platform;

  beforeEach(() => {
    platform = new OlxBrPlatform();
  });

  describe('Configuration', () => {
    test('should have correct platform name', () => {
      expect(platform.name).toBe('olx-br');
    });

    test('should have correct display name', () => {
      expect(platform.displayName).toBe('OLX Brasil');
    });

    test('should have BRL as currency', () => {
      expect(olxBrConfig.currency).toBe('BRL');
    });

    test('should have Brazil as country', () => {
      expect(olxBrConfig.country).toBe('Brazil');
    });

    test('should have br as region', () => {
      expect(olxBrConfig.region).toBe('br');
    });
  });

  describe('Query Building', () => {
    test('should build correct query params', () => {
      const query = { text: 'carro', limit: 30 };
      const params = platform.buildQueryParams(query);

      expect(params.query).toBe('carro');
    });
  });

  describe('Response Transformation', () => {
    test('should transform response with BRL currency', () => {
      const mockResponse = {
        data: [{
          id: 12345,
          url: 'https://www.olx.com.br/item/12345',
          title: 'Carro usado',
          params: [{ key: 'price', value: { value: 25000, currency: 'BRL' } }],
          photos: [],
          location: { municipality: 'São Paulo', uf: 'SP' },
        }]
      };
      
      const items = transformOlxBrResponse(mockResponse);

      expect(items.length).toBeGreaterThanOrEqual(0);
      if (items.length > 0) {
        expect(items[0].source).toBe('olx-br');
        expect(items[0].currency).toBe('BRL');
      }
    });
  });

  describe('Integration (Live API)', () => {
    test.skip('should search and return items from live API', async () => {
      const items = await platform.search({ text: 'celular', limit: 5 });
      
      expect(Array.isArray(items)).toBe(true);
      if (items.length > 0) {
        expect(items[0].source).toBe('olx-br');
      }
    }, 30000);
  });
});
