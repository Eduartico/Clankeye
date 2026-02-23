import ToggleDarkTheme from "../buttons/ToggleDarkTheme";
import { useQuery } from "../../contexts/QueryContextType";
import SearchBar from "../search/SearchBar";

export default function Navbar() {
  const { setQuery } = useQuery();

  return (
    <nav className="bg-background-paper sticky w-full z-20 top-0 start-0 border-b border-border-default">
      <div className="w-full flex items-center gap-4 py-3 px-6">
        {/* Logo — uses favicon */}
        <a
          href="/"
          className="flex items-center gap-2 shrink-0 group"
        >
          <img src="/favicon.ico" className="h-7 w-7" alt="Clankeye" />
          <span className="text-xl font-bold whitespace-nowrap text-text-primary hidden sm:inline">
            Clankeye
          </span>
        </a>

        {/* Search bar — centered, fills available space */}
        <SearchBar setQuery={setQuery} />

        {/* Right side controls */}
        <div className="flex items-center gap-3 shrink-0">
          <ToggleDarkTheme showSettings />
        </div>
      </div>
    </nav>
  );
}
