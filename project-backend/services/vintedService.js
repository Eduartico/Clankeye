import { fetchCookies, getWithCookies } from '../utils/httpClient.js';

export const fetchVintedOffersService = async (queryParams) => {
  try {
    const cookies = await fetchCookies(); 
    const response = await getWithCookies('https://www.vinted.fr/api/v2/catalog/items', cookies, {
      search_text: queryParams.text,
      currency: queryParams.currency,
      order: queryParams.order,
      page: queryParams.page || 1,
      per_page: queryParams.per_page || 96,
    });
    
    return response.items;
  } catch (error) {
    console.error('Error fetching Vinted items:', error.message);
    throw error;
  }
};
