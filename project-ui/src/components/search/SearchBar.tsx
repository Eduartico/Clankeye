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
      className="flex items-center gap-x-3 flex-1 max-w-2xl mx-4"
      onSubmit={(e) => handleSearch(e)}
    >
      <input
        id="searchInput"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="What are you looking for?"
        className="flex-1 h-12 px-4 text-base text-white bg-zinc-900 dark:bg-zinc-950 ring-2 outline-none ring-zinc-700 dark:ring-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition ease-in-out duration-200 placeholder-zinc-500"
      />
      <button
        type="submit"
        className="h-12 bg-primary-600 hover:bg-primary-500 text-white py-2 px-6 rounded-lg font-semibold transition ease-in-out duration-200 focus:ring-4 focus:outline-none focus:ring-primary-700 whitespace-nowrap"
      >
        Search
      </button>
    </form>
  );
}
