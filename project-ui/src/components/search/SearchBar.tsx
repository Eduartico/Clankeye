import React from "react";

interface SearchBarProps {
  searchInput: string;
  setSearchInput: (searchInput: string) => void;
  setQuery: (query: string) => void;
}

export default function SearchBar({
  searchInput,
  setSearchInput,
  setQuery,
}: SearchBarProps) {
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
  };

  return (
    <form
      className="flex items-center gap-x-4"
      onSubmit={(e) => handleSearch(e)}
    >
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Type here..."
        className="w-full md:w-96 h-10 p-2 dark:text-white dark:bg-zinc-900 ring-2 outline-none ring-gray-300 dark:ring-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-thunderbird-400 transition ease-in-out duration-200"
      />
      <button
        type="submit"
        className="h-10 bg-zinc-800 hover:bg-zinc-900 text-white py-2 px-4 rounded-md transition ease-in-out duration-200 focus:ring-4 focus:outline-none focus:ring-thunderbird-500"
      >
        Search
      </button>
    </form>
  );
}
