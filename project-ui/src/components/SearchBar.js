import React, { useState } from 'react';

function SearchBar({ setQuery }) {
    const [input, setInput] = useState('');

    const handleSearch = () => {
        setQuery(input);
    };

    return (
        <div className="search-bar">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search for items..."
            />
            <button onClick={handleSearch}>Search</button>
        </div>
    );
}

export default SearchBar;
