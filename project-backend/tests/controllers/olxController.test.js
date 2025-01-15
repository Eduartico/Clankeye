const request = require('supertest');
const express = require('express');
const olxRoutes = require('../../routes/olxRoutes');
const { saveToFile } = require('../../utils/fileHandler');

jest.mock('../../utils/fileHandler', () => ({
    saveToFile: jest.fn(),
}));

jest.mock('../../services/olxService.js', () => ({
    fetchOlxOffers: jest.fn(),
}));

const { fetchOlxOffers } = require('../../services/olxService.js');

const app = express();
app.use(express.json());
app.use('/api/olx', olxRoutes);

describe('OLX Controller - fetchOffers', () => {
    beforeEach(() => {
        jest.clearAllMocks(); 
    });

    test('should return parsed items with a 200 status', async () => {
        const mockOlxResponse = {
            data: [
                {
                    id: 1,
                    url: 'https://example.com/item/1',
                    title: 'Test Item',
                    description: 'A test item description',
                    created_time: '2023-01-01T00:00:00+00:00',
                    last_refresh_time: '2023-01-02T00:00:00+00:00',
                    valid_to_time: '2023-01-31T00:00:00+00:00',
                    promotion: { highlighted: true, urgent: false, top_ad: false },
                    params: [{ key: 'price', value: { value: 100, currency: 'EUR', negotiable: true } }],
                    business: false,
                },
            ],
            metadata: {},
            links: {},
        };

        fetchOlxOffers.mockResolvedValue(mockOlxResponse);

        const response = await request(app).get('/api/olx/offers');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1); 
        expect(response.body.data[0].title).toBe('Test Item'); 
        expect(saveToFile).toHaveBeenCalledWith(expect.any(String), expect.any(String)); 
    });

    test('should handle errors gracefully', async () => {
        fetchOlxOffers.mockRejectedValue(new Error('OLX API failed'));

        const response = await request(app).get('/api/olx/offers');

        expect(response.status).toBe(500); 
        expect(response.body.success).toBe(false); 
        expect(response.body.error).toBe('OLX API failed');
    });
});
