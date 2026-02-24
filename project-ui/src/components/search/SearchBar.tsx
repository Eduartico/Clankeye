import React, { useState } from "react";

interface SearchBarProps {
  setQuery: (query: string) => void;
}

export default function SearchBar({ setQuery }: SearchBarProps) {
  const [search, setSearch] = useState("");
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
  };

  return (
    <form
      className="flex items-center gap-x-3 flex-1 px-4"
      onSubmit={(e) => handleSearch(e)}
    >
      <input
        id="searchInput"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="What are you looking for?"
        className="glass-input flex-1 h-11 px-5 text-base"
      />
      <button
        type="submit"
        className="glass-btn glass-btn-primary h-11 px-7 rounded-xl"
      >
        Search
      </button>
    </form>
  );
}
