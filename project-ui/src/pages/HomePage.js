import React, { useState, useEffect } from 'react';
import { fetchItems } from '../services/api';
import SearchBar from '../components/SearchBar';
//import Filters from '../components/Filters';
import ItemCard from '../components/ItemCard';
//import Pagination from '../components/Pagination';

function HomePage() {
    const [items, setItems] = useState([]);
    const [query, setQuery] = useState('clone wars');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadItems = async () => {
            setLoading(true);
            try {
                const data = await fetchItems({ query });
                setItems(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadItems();
    }, [query]);

    return (
        <div className="homepage">
            <SearchBar setQuery={setQuery} />
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}
            <div className="items-grid">
                {items.map((item) => (
                    <ItemCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}

export default HomePage;
