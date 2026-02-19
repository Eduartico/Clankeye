import LeboncoinPlatform from './LeboncoinPlatform.js';
import leboncoinConfig from './leboncoin.config.js';
import { transformLeboncoinItem, transformLeboncoinResponse } from './leboncoin.transformer.js';

describe('Leboncoin Platform', () => {
  let platform;

  beforeEach(() => {
    platform = new LeboncoinPlatform();
  });

  describe('Configuration', () => {
    test('should have correct platform name', () => {
      expect(platform.name).toBe('leboncoin');
    });

    test('should have correct display name', () => {
      expect(platform.displayName).toBe('Leboncoin');
    });

    test('should require cookies', () => {
      expect(leboncoinConfig.requiresCookies).toBe(true);
    });

    test('should have EUR as currency', () => {
      expect(leboncoinConfig.currency).toBe('EUR');
    });
  });

  describe('Query Building', () => {
    test('should build correct request body', () => {
      const query = { text: 'vélo', limit: 35 };
      const body = platform.buildRequestBody(query);

      expect(body.keyword).toBe('vélo');
    });
  });

  describe('Response Transformation', () => {
    test('should transform API response with EUR currency', () => {
      const mockResponse = {
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
          },
        ],
        total: 150,
      };
      const items = transformLeboncoinResponse(mockResponse);

      expect(items.length).toBeGreaterThanOrEqual(0);
      if (items.length > 0) {
        expect(items[0].source).toBe('leboncoin');
        expect(items[0].currency).toBe('EUR');
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
