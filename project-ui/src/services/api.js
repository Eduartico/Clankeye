import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000'; 

export const fetchItems = async (query) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/offers`, {
            params: query,
        });
        return response.data.data; 
    } catch (error) {
        console.error('Error fetching items:', error.message);
        throw error;
    }
};
