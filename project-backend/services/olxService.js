import axios from 'axios';

const BASE_URL = 'https://www.olx.pt/api/v1/offers/';

export const fetchOlxOffers = async (queryParams) => {
    try {
        const response = await axios.get(BASE_URL, { params: queryParams });
        return response.data;
    } catch (error) {
        console.error('Error fetching data from OLX:', error.message);
        throw new Error('Failed to fetch data from OLX API.');
    }
};
