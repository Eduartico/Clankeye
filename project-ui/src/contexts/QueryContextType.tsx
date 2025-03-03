import { createContext, useEffect, useState, ReactNode, useContext } from "react";

interface QueryContextType {
  query: string;
  setQuery: (query: string) => void;
  queryVersion: number;
}

const QueryContext = createContext<QueryContextType | undefined>(undefined);

export function QueryProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [queryVersion, setQueryVersion] = useState(0);

  const updateQuery = (newQuery: string) => {
    setQuery(newQuery);
    setQueryVersion((prev) => prev + 1);
  };

  return (
    <QueryContext.Provider value={{ query, setQuery: updateQuery, queryVersion }}>
      {children}
    </QueryContext.Provider>
  );
}

export function useQuery() {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error("useQuery must be used within a QueryProvider");
  }
  return context;
}

