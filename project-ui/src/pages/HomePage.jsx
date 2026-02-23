import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { crawlSearch, crawlMore } from "../services/api";
import GridCards from "../components/grid/GridCards";
import CardItem from "../components/cards/CardItem";
import DuplicatePanel from "../components/duplicates/DuplicatePanel";
import PlatformSidebar from "../components/sidebar/PlatformSidebar";
import TermsPanel from "../components/terms/TermsPanel";
import { useQuery } from "../contexts/QueryContextType";

const ALL_PLATFORMS = [
  "olx-pt", "olx-br", "olx-pl", "vinted",
  "ebay", "wallapop", "todocoleccion", "leboncoin",
];

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [platformStats, setPlatformStats] = useState({});
  const [pages, setPages] = useState({}); // per-platform page tracking
  const { query, queryVersion, setQuery } = useQuery();

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDuplicateItem, setSelectedDuplicateItem] = useState(null);
  const [meta, setMeta] = useState(null);

  // Platform sidebar state
  const [selectedPlatforms, setSelectedPlatforms] = useState(ALL_PLATFORMS);
  const [vintedCountry, setVintedCountry] = useState("pt");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);

  // Per-platform search status for sidebar icons
  const [platformStatus, setPlatformStatus] = useState({});

  // Track which platforms have been exhausted (returned 0 new items)
  const [exhaustedPlatforms, setExhaustedPlatforms] = useState(new Set());

  // Debounce ref to prevent triple search
  const searchRef = useRef(null);

  // Wishlist & filter terms
  const [wishlistTerms, setWishlistTerms] = useState([]);
  const [filterTerms, setFilterTerms] = useState([]);

  // Grid columns control
  const [gridColumns, setGridColumns] = useState(3);

  // ─── Sidebar resize drag ────────────────────────────────────────
  const sidebarResizing = useRef(false);
  const handleSidebarMouseDown = useCallback((e) => {
    e.preventDefault();
    sidebarResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMouseMove = (ev) => {
      if (!sidebarResizing.current) return;
      const newWidth = Math.max(180, Math.min(450, startWidth + (ev.clientX - startX)));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      sidebarResizing.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth]);

  // Memoised: apply filter (remove items matching filter terms) + mark wishlisted items
  const { visibleItems, wishlistedIds } = useMemo(() => {
    const lowerFilter = filterTerms.map((t) => t.toLowerCase());
    const lowerWishlist = wishlistTerms.map((t) => t.toLowerCase());

    const matchesAny = (item, terms) => {
      const searchable = [
        item.title || "",
        item.description || "",
        item.category || "",
      ]
        .join(" ")
        .toLowerCase();
      return terms.some((t) => searchable.includes(t));
    };

    // Filter > wishlist: if item matches a filter term, it's removed regardless
    const filtered = items.filter((item) => !matchesAny(item, lowerFilter));

    const wIds = new Set();
    for (const item of filtered) {
      if (matchesAny(item, lowerWishlist)) {
        wIds.add(item.id || `${item.source}-${item.externalId}`);
      }
    }

    return { visibleItems: filtered, wishlistedIds: wIds };
  }, [items, filterTerms, wishlistTerms]);

  // ─── AUTO-SEARCH FOR TESTING (remove before production) ─────────
  useEffect(() => {
    const t = setTimeout(() => setQuery("clone wars"), 10000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Initial parallel search ────────────────────────────────────
  useEffect(() => {
    if (!query) {
      setItems([]);
      setDuplicateGroups([]);
      setPlatformStats({});
      setPages({});
      setMeta(null);
      return;
    }

    // Cancel any pending search
    if (searchRef.current) {
      searchRef.current.cancelled = true;
    }

    const thisSearch = { cancelled: false };
    searchRef.current = thisSearch;

    const loadItems = async () => {
      setLoading(true);
      setError(null);
      setItems([]);
      setDuplicateGroups([]);
      setPlatformStats({});
      setExhaustedPlatforms(new Set());

      // Mark all selected platforms as queued immediately
      const queued = {};
      selectedPlatforms.forEach((p) => { queued[p] = "queued"; });
      setPlatformStatus(queued);

      // Short tick so "queued" renders before we move to "loading"
      await new Promise((r) => setTimeout(r, 50));
      if (thisSearch.cancelled) return;

      // Mark all as loading
      const loading = {};
      selectedPlatforms.forEach((p) => { loading[p] = "loading"; });
      setPlatformStatus(loading);

      try {
        const data = await crawlSearch(
          query,
          selectedPlatforms.length > 0 ? selectedPlatforms : null,
          {},
          vintedCountry
        );

        // Don't apply results if this search was cancelled
        if (thisSearch.cancelled) return;

        setItems(data.items || []);
        setDuplicateGroups(data.duplicateGroups || []);
        setPlatformStats(data.platformStats || {});
        setMeta(data.meta || null);

        // Initialize pages (all start at 1 after first search)
        const initialPages = {};
        const exhausted = new Set();
        const finalStatus = {};
        for (const [platform, stat] of Object.entries(data.platformStats || {})) {
          initialPages[platform] = 1;
          if (stat.count === 0) exhausted.add(platform);
          // Set status icon based on result
          if (!stat.success) finalStatus[platform] = "failed";
          else if (stat.count === 0) finalStatus[platform] = "empty";
          else finalStatus[platform] = "done";
        }
        setPages(initialPages);
        setExhaustedPlatforms(exhausted);
        setPlatformStatus(finalStatus);
      } catch (err) {
        if (!thisSearch.cancelled) {
          setError(err.message);
          // Mark all as failed on network error
          const failed = {};
          selectedPlatforms.forEach((p) => { failed[p] = "failed"; });
          setPlatformStatus(failed);
        }
      } finally {
        if (!thisSearch.cancelled) setLoading(false);
      }
    };

    loadItems();

    return () => {
      thisSearch.cancelled = true;
    };
  }, [query, queryVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── "Get More Items" handler ───────────────────────────────────
  const handleLoadMore = useCallback(
    async (targetPlatforms = null) => {
      if (loadingMore || !query) return;
      setLoadingMore(true);

      try {
        // If no specific platforms, load more from ALL non-exhausted platforms
        const platformsToFetch =
          targetPlatforms ||
          Object.keys(pages).filter((p) => !exhaustedPlatforms.has(p));

        if (platformsToFetch.length === 0) return;

        // Increment page for each platform we're fetching
        const nextPages = {};
        platformsToFetch.forEach((p) => {
          nextPages[p] = (pages[p] || 1) + 1;
        });

        const data = await crawlMore(query, platformsToFetch, nextPages, items, vintedCountry);

        if (data.newItems?.length > 0) {
          setItems((prev) => [...prev, ...data.newItems]);
        }

        if (data.duplicateGroups) {
          setDuplicateGroups(data.duplicateGroups);
        }

        // Update pages and track exhausted platforms
        setPages((prev) => ({ ...prev, ...nextPages }));
        const newExhausted = new Set(exhaustedPlatforms);
        for (const [platform, stat] of Object.entries(
          data.platformStats || {}
        )) {
          if (stat.count === 0) newExhausted.add(platform);
          if (data.platformStats[platform]) {
            setPlatformStats((prev) => ({
              ...prev,
              [platform]: {
                ...prev[platform],
                page: nextPages[platform],
                totalCount:
                  (prev[platform]?.totalCount || prev[platform]?.count || 0) +
                  stat.count,
              },
            }));
          }
        }
        setExhaustedPlatforms(newExhausted);
      } catch (err) {
        console.error("Load more error:", err);
      } finally {
        setLoadingMore(false);
      }
    },
    [query, pages, items, exhaustedPlatforms, loadingMore, vintedCountry]
  );

  // ─── Duplicate panel handlers ───────────────────────────────────
  const handleDuplicateClick = (item) => {
    setSelectedDuplicateItem(item);
  };

  const closeDuplicatePanel = () => {
    setSelectedDuplicateItem(null);
  };

  // ─── Platform stats bar ─────────────────────────────────────────
  const allExhausted =
    Object.keys(pages).length > 0 &&
    Object.keys(pages).every((p) => exhaustedPlatforms.has(p));

  return (
    <>
      {/* Platform sidebar */}
      <aside
        className={`shrink-0 border-r border-border-default bg-background-paper transition-all duration-200 relative flex flex-col ${
          sidebarCollapsed ? "w-14" : ""
        }`}
        style={sidebarCollapsed ? { minHeight: 0, maxHeight: '100%' } : { width: sidebarWidth, minHeight: 0, maxHeight: '100%' }}
      >
        <div className="flex-1 overflow-y-auto min-h-0">
          <PlatformSidebar
            selectedPlatforms={selectedPlatforms}
            onPlatformsChange={setSelectedPlatforms}
            vintedCountry={vintedCountry}
            onVintedCountryChange={setVintedCountry}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            platformStatus={platformStatus}
          />

          {/* Wishlist & Filter terms */}
          {!sidebarCollapsed && (
            <div className="px-3 pb-4 mt-2 border-t border-border-default pt-3">
              <TermsPanel
                items={items}
                onTermsChange={(wl, fl) => {
                  setWishlistTerms(wl);
                  setFilterTerms(fl);
                }}
              />
          </div>
        )}
        </div>

        {/* Resize handle */}
        {!sidebarCollapsed && (
          <div
            onMouseDown={handleSidebarMouseDown}
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary-400/50 active:bg-primary-500/60 transition-colors z-10"
          />
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full flex flex-col bg-background-default py-5 gap-5 px-8">
          {/* Search meta info */}
          {meta && items.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-slate-700 dark:text-white">
                {visibleItems.length} items
                {visibleItems.length !== items.length && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({items.length - visibleItems.length} filtered)
                  </span>
                )}
              </span>
              <span>•</span>
              <span>{meta.wallTimeMs}ms</span>
              <span>•</span>
              <span>⚡ Parallel search</span>
              {duplicateGroups.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-500 font-medium">
                    🔁 {duplicateGroups.length} duplicate group
                    {duplicateGroups.length > 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Platform stats chips */}
          {Object.keys(platformStats).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(platformStats).map(([platform, stat]) => (
                <button
                  key={platform}
                  onClick={() => {
                    if (!exhaustedPlatforms.has(platform)) {
                      handleLoadMore([platform]);
                    }
                  }}
                  disabled={exhaustedPlatforms.has(platform) || loadingMore}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    exhaustedPlatforms.has(platform)
                      ? "bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500 cursor-not-allowed"
                      : "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 cursor-pointer"
                  }`}
                >
                  {platform}: {stat.totalCount || stat.count} items (p{pages[platform] || 1})
                  {exhaustedPlatforms.has(platform) ? " ✓" : " +"}
                </button>
              ))}
            </div>
          )}

          {/* Grid columns control */}
          {visibleItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Grid:</span>
              {[1, 2, 3, 4, 5, 6].map((cols) => (
                <button
                  key={cols}
                  onClick={() => setGridColumns(cols)}
                  className={`w-7 h-7 text-xs rounded-lg font-bold transition-all ${
                    gridColumns === cols
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  }`}
                >
                  {cols}
                </button>
              ))}
            </div>
          )}

          {/* Item grid */}
          <GridCards columns={gridColumns}>
            {visibleItems.map((item, idx) => (
              <CardItem
                key={item.id || `${item.source}-${idx}`}
                item={item}
                isWishlisted={wishlistedIds.has(item.id || `${item.source}-${item.externalId}`)}
                onDuplicateClick={handleDuplicateClick}
              />
            ))}
          </GridCards>

          {/* Load more button */}
          {visibleItems.length > 0 && !allExhausted && (
            <div className="flex justify-center py-6">
              <button
                onClick={() => handleLoadMore()}
                disabled={loadingMore}
                className="px-8 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Loading more items...
                  </>
                ) : (
                  <>🔄 Get More Items</>
                )}
              </button>
            </div>
          )}

          {/* All exhausted message */}
          {allExhausted && visibleItems.length > 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-zinc-500 py-4">
              All platforms have been fully loaded.
            </p>
          )}

          {/* Empty / loading / error states */}
          {visibleItems.length === 0 && query && !loading && (
            <h1 className="text-center text-2xl font-bold text-slate-700 dark:text-white">
              No results found.
            </h1>
          )}
          {!visibleItems.length && query && loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <svg
                className="animate-spin h-10 w-10 text-primary-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <h1 className="text-center text-xl font-bold text-slate-700 dark:text-white">
                ⚡ Searching all platforms in parallel...
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This may take 30-60 seconds while browsers load
              </p>
            </div>
          )}
          {!visibleItems.length && !query && (
            <h1 className="text-center text-lg font-bold text-slate-700 dark:text-white">
              search for something bro hurry up
            </h1>
          )}

          {/* Error display */}
          {error && (
            <div className="text-center text-red-500 dark:text-red-400 py-4">
              <p className="font-bold">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate panel modal */}
      {selectedDuplicateItem && (
        <DuplicatePanel
          item={selectedDuplicateItem}
          duplicateGroups={duplicateGroups}
          onClose={closeDuplicatePanel}
        />
      )}
    </>
  );
}
