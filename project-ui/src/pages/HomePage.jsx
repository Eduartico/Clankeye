import React, { useState, useEffect } from "react";
import { fetchItems } from "../services/api";
import SearchBar from "../components/search/SearchBar";
import CloseIcon from "@mui/icons-material/Close";
import PaginationHandler from "../components/pagination/Pagination";
import GridCards from "../components/grid/GridCards";
import CardItem from "../components/cards/CardItem";
import Header from "../components/header/Header";
import SelectedItem from "../components/selected/SelectedItem";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

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

    if (!query) {
      setItems([]);
      return;
    }

    loadItems();
  }, [query]);

  return (
    <div className="w-full h-full flex flex-col relative dark:bg-zinc-900 py-5 gap-5">
      <Header>
        <h1 className="text-3xl font-bold text-slate-700 dark:text-white">
          What are you looking for?
        </h1>
        <SearchBar searchInput={searchInput} setSearchInput={setSearchInput} setQuery={setQuery} />
      </Header>
      {query && (
        <div className="w-full flex items-center gap-x-4 px-32">
          <SelectedItem
            item={{
              title: query,
              remove: () => setQuery(""),
              icon: <CloseIcon />,
            }}
          />
        </div>
      )}
      <div className="w-full h-full gap-y-4 dark:bg-zinc-950 rounded-xl p-5">
        <GridCards>
          {items.map((item) => (
            <CardItem key={item.id} item={item} />
          ))}
        </GridCards>
        {items.length === 0 && query && <h1>No results found.</h1>}
        {!items.length && query && <h1 className="text-center text-2xl font-bold text-slate-700 dark:text-white">Loading...</h1>}
        {!items.length && !query && <h1 className="text-center text-lg font-bold text-slate-700 dark:text-white">search for something bro hurry up</h1>}
        <PaginationHandler
          page={page}
          count={totalPages}
          onChange={handleChangePage}
        />
      </div>
    </div>
  );
}
