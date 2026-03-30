import ToggleDarkTheme from "../buttons/ToggleDarkTheme";
import { useQuery } from "../../contexts/QueryContextType";
import SearchBar from "../search/SearchBar";
import { GlassPanel } from "../glass";

export default function Navbar() {
  const { setQuery } = useQuery();

  return (
    <GlassPanel
      intensity="medium"
      className="sticky w-full z-20 top-0 start-0"
      contentClassName="flex flex-col"
      glassProps={{ borderRadius: 0 }}
    >
      <nav className="w-full flex items-center py-3 px-6">
        {/* Logo — left, fixed width so search stays truly centred */}
        <a
          href="/"
          className="flex items-center gap-2 shrink-0 min-w-[160px] group"
        >
          <img src="/favicon.ico?v=2" className="h-7 w-7" alt="Clankeye" />
          <span className="text-xl font-bold whitespace-nowrap hidden sm:inline glass-text">
            Clankeye
          </span>
        </a>

        {/* Search bar — flex-1, takes all remaining space between logo and controls */}
        <SearchBar setQuery={setQuery} />

        {/* Right controls — mirror width of logo block so search is centred */}
        <div className="flex items-center gap-3 shrink-0 min-w-[160px] justify-end">
          <ToggleDarkTheme showSettings />
        </div>
      </nav>
    </GlassPanel>
  );
}
