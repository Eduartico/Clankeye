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
      className="flex items-center gap-x-4"
      onSubmit={(e) => handleSearch(e)}
    >
      <input
        id="searchInput"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="What are you looking for?"
        className="min-w-52 cl:min-w-96 h-10 p-2 dark:text-white dark:bg-zinc-900 ring-2 outline-none ring-gray-300 dark:ring-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-thunderbird-400 transition ease-in-out duration-200"
      />
      <button
        type="submit"
        className="h-11 bg-zinc-800 hover:bg-thunderbird-500 text-white py-2 px-4 rounded-md transition ease-in-out duration-200 focus:ring-4 focus:outline-none focus:ring-thunderbird-700"
      >
        Search
      </button>
    </form>
  );
}
