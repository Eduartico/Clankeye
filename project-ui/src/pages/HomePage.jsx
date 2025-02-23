import React, { useState, useEffect } from "react";
import { fetchItems } from "../services/api";
import GridCards from "../components/grid/GridCards";
import CardItem from "../components/cards/CardItem";
import { useQuery } from "../contexts/QueryContextType";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const { query, setQuery } = useQuery();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      try {
        setItems([]);
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
    <div className="w-full h-full flex flex-col relative dark:bg-zinc-900 py-5 gap-5 px-14">
      <GridCards>
        {items.map((item) => (
          <CardItem key={item.id} item={item} />
        ))}
      </GridCards>
      {items.length === 0 && query && !loading && (
        <h1 className="text-center text-2xl font-bold text-slate-700 dark:text-white">
          No results found.
        </h1>
      )}
      {!items.length && query && loading && (
        <h1 className="text-center text-2xl font-bold text-slate-700 dark:text-white">
          Loading...
        </h1>
      )}
      {!items.length && !query && (
        <h1 className="text-center text-lg font-bold text-slate-700 dark:text-white">
          search for something bro hurry up
        </h1>
      )}
    </div>
  );
}
