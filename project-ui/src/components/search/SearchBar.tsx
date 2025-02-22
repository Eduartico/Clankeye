import React from "react";

interface SearchBarProps {
  searchInput: string;
  setSearchInput: (searchInput: string) => void;
  setQuery: (query: string) => void;
}

export default function SearchBar({ searchInput, setSearchInput, setQuery }: SearchBarProps) {

  const handleSearch = (e : React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
    setSearchInput("");
  };

  return (
    <form className="flex items-center gap-x-4" onSubmit={(e) => handleSearch(e)}>
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Type here..."
        className="w-full md:w-96 h-10 p-2 dark:text-white dark:bg-slate-950 ring-2 outline-none ring-gray-200 dark:ring-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-lochmara-400 transition ease-in-out duration-200"
      />
      <button
        type="submit"
        className="h-10 bg-lochmara-600 hover:bg-lochmara-700 text-white py-2 px-4 rounded-md transition ease-in-out duration-200 focus:ring-4 focus:outline-none focus:ring-lochmara-300 dark:focus:ring-lochmara-800"
      >
        Search
      </button>
    </form>
  );
}
