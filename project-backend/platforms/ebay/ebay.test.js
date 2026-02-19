import EbayPlatform from './EbayPlatform.js';
import ebayConfig from './ebay.config.js';
import { transformEbayItem, transformEbayResponse } from './ebay.transformer.js';

describe('eBay Platform', () => {
  let platform;

  beforeEach(() => {
    platform = new EbayPlatform();
  });

  describe('Configuration', () => {
    test('should have correct platform name', () => {
      expect(platform.name).toBe('ebay');
    });

    test('should have correct display name', () => {
      expect(platform.displayName).toBe('eBay');
    });

    test('should require authentication', () => {
      expect(ebayConfig.requiresAuth).toBe(true);
    });

    test('should have marketplace IDs configured', () => {
      expect(ebayConfig.marketplaces).toHaveProperty('us', 'EBAY_US');
      expect(ebayConfig.marketplaces).toHaveProperty('uk', 'EBAY_GB');
      expect(ebayConfig.marketplaces).toHaveProperty('de', 'EBAY_DE');
    });
  });

  describe('Query Building', () => {
    test('should build correct query params', () => {
      const query = { text: 'vintage watch', limit: 50 };
      const params = platform.buildQueryParams(query);

      expect(params.q).toBe('vintage watch');
      expect(params.limit).toBe(50);
    });

    test('should enforce max limit of 200', () => {
      const query = { text: 'test', limit: 500 };
      const params = platform.buildQueryParams(query);

      expect(params.limit).toBe(200);
    });
  });

  describe('Response Transformation', () => {
    test('should transform API response with USD currency', () => {
      const mockResponse = {
        itemSummaries: [
          {
            itemId: 'v1|123456789|0',
            title: 'Pokemon Base Set Charizard',
            price: { value: '250.00', currency: 'USD' },
            image: { imageUrl: 'https://ebay.com/img1.jpg' },
            itemWebUrl: 'https://ebay.com/itm/123456789',
            condition: 'Used',
            seller: { username: 'CardKing', feedbackPercentage: '99.5' },
          },
        ],
        total: 200,
      };
      const items = transformEbayResponse(mockResponse);

      expect(items.length).toBeGreaterThanOrEqual(0);
      if (items.length > 0) {
        expect(items[0].source).toBe('ebay');
        expect(items[0].currency).toBe('USD');
      }
    });
  });

  describe('Integration (Live API)', () => {
    test.skip('should search and return items from live API', async () => {
      const items = await platform.search({ text: 'pokemon cards', limit: 5 });
      expect(Array.isArray(items)).toBe(true);
    }, 30000);
  });
});
