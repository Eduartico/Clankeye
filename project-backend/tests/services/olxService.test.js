const axios = require('axios');
const { fetchOlxOffers } = require('../../services/olxService');

jest.mock('axios');

describe('OLX Service - fetchOlxOffers', () => {
    test('should fetch data successfully', async () => {
        const mockResponse = {
            data: {
                data: [{ id: 123, title: 'Test Item' }],
            },
        };

        axios.get.mockResolvedValue(mockResponse);

        const response = await fetchOlxOffers({ query: 'test' });
        expect(response).toEqual(mockResponse.data);
    });

    test('should throw an error when the request fails', async () => {
        axios.get.mockRejectedValue(new Error('API Error'));

        await expect(fetchOlxOffers({ query: 'test' })).rejects.toThrow('Failed to fetch data from OLX API.');
    });
});
