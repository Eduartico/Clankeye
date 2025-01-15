const Item = require('../../models/item');

describe('Item Model', () => {
    test('should create an Item object with correct properties', () => {
        const itemData = {
            id: 123,
            url: 'https://example.com/item/123',
            title: 'Test Item',
            description: 'A test description',
            price: 100,
            currency: 'EUR',
            negotiable: true,
            createdTime: '2023-01-01T00:00:00+00:00',
            lastRefreshTime: '2023-01-02T00:00:00+00:00',
            validToTime: '2023-01-31T00:00:00+00:00',
            isHighlighted: true,
            isUrgent: false,
            isTopAd: false,
            business: false,
        };

        const item = new Item(itemData);

        expect(item).toMatchObject(itemData);
    });
});
