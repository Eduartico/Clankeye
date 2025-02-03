import axios from 'axios';

export const getWithCookies = async (url, cookies, params = {}) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Cookie': cookies.join('; '),
      },
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error with GET request:', error);
    throw error;
  }
};

export const fetchCookies = async () => {
  try {
    const response = await axios.get('https://www.vinted.fr', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      maxRedirects: 0,
    });

    return response.headers['set-cookie']; 
  } catch (error) {
    console.error('Error fetching cookies:', error);
    throw error;
  }
};
