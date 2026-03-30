import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { crawlSearchStream, crawlMore } from "../services/api";
import GridCards from "../components/grid/GridCards";
import CardItem from "../components/cards/CardItem";
import DuplicatePanel from "../components/duplicates/DuplicatePanel";
import PlatformSidebar, { DEFAULT_PLATFORM_CONFIGS } from "../components/sidebar/PlatformSidebar";
import TermsPanel from "../components/terms/TermsPanel";
import { useQuery } from "../contexts/QueryContextType";
import { GlassSurface } from "../components/glass";
import {
  Search,
  Zap,
  Copy,
  Check,
  X,
  Circle,
  CheckCircle2,
  CalendarDays,
  Filter,
} from "lucide-react";

const ALL_PLATFORMS = DEFAULT_PLATFORM_CONFIGS.map((p) => p.id);

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [platformStats, setPlatformStats] = useState({});
  const [pages, setPages] = useState({}); // per-platform page tracking
  const { query, queryVersion, setQuery } = useQuery();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDuplicateItem, setSelectedDuplicateItem] = useState(null);
  const [meta, setMeta] = useState(null);

  // Platform sidebar state
  const [selectedPlatforms, setSelectedPlatforms] = useState(ALL_PLATFORMS);
  const [vintedCountry, setVintedCountry] = useState("pt");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [platformOrder, setPlatformOrder] = useState(DEFAULT_PLATFORM_CONFIGS);

  // Per-platform search status for sidebar icons
  const [platformStatus, setPlatformStatus] = useState({});

  // Track which platforms have been exhausted (returned 0 new items)
  const [exhaustedPlatforms, setExhaustedPlatforms] = useState(new Set());

  // Pending items accumulated during SSE streaming (shown only after all platforms finish)
  const [pendingItems, setPendingItems] = useState([]);

  // ── Page-based navigation state ──
  const [pageItems, setPageItems] = useState({});       // { 1: [...items], 2: [...items] }
  const [currentPage, setCurrentPage] = useState(1);
  const [preloading, setPreloading] = useState(false);
  const preloadingRef = useRef(false);

  // Debounce ref to prevent triple search
  const searchRef = useRef(null);

  /**
   * Sort items by date (newest first). Undated items are interleaved
   * among dated items instead of pushed to the end.
   */
  const sortByDate = useCallback((itemsToSort) => {
    const parseTime = (item) => {
      const val = item.createdTime || item.date || item.time;
      if (!val) return null;
      if (val instanceof Date) return val.getTime();
      if (typeof val === 'number') return val;

      // Strip "Para o topo a " / "Odświeżono " prefix (OLX bump indicators)
      const str = String(val).trim().replace(/^(Para o topo a|Odświeżono|Promoted|Destacado)\s+/i, '').trim();
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) return parsed;

      const now = Date.now();
      const lower = str.toLowerCase();
      const numMatch = lower.match(/(\d+)/);
      const num = numMatch ? parseInt(numMatch[1], 10) : 1;

      if (/minut|min\b/.test(lower)) return now - num * 60 * 1000;
      if (/hour|heure|hora|stund|godzin|timm|uur/.test(lower)) return now - num * 3600 * 1000;
      if (/day|jour|día|dia|tag|dzień|dag/.test(lower)) return now - num * 86400 * 1000;
      if (/week|semaine|semana|woche|tydzień|tydz/.test(lower)) return now - num * 7 * 86400 * 1000;
      if (/month|mois|mes|monat|miesi/.test(lower)) return now - num * 30 * 86400 * 1000;

      // Today with optional time
      if (/today|aujourd|hoy|hoje|heute|dziś|dzisiaj|vandaag/.test(lower)) {
        const timeMatch = lower.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const d = new Date();
          d.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
          return d.getTime();
        }
        return now;
      }
      // Yesterday with optional time
      if (/yesterday|hier|ayer|ontem|gestern|wczoraj/.test(lower)) {
        const timeMatch = lower.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const d = new Date(now - 86400 * 1000);
          d.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
          return d.getTime();
        }
        return now - 86400 * 1000;
      }

      // Portuguese full dates: "23 de fevereiro de 2026"
      const ptMonths = { janeiro: 0, fevereiro: 1, 'março': 2, marco: 2, abril: 3, maio: 4, junho: 5, julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11 };
      const ptMatch = lower.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
      if (ptMatch) {
        const month = ptMonths[ptMatch[2]];
        if (month !== undefined) {
          const d = new Date(parseInt(ptMatch[3], 10), month, parseInt(ptMatch[1], 10));
          const tm = lower.match(/(\d{1,2}):(\d{2})/);
          if (tm) d.setHours(parseInt(tm[1], 10), parseInt(tm[2], 10));
          return d.getTime();
        }
      }

      // Polish/Spanish/French short dates: "23 lut 2026", "23 feb 2026"
      const intlMonths = { sty: 0, lut: 1, mar: 2, kwi: 3, maj: 4, cze: 5, lip: 6, sie: 7, wrz: 8, 'paź': 9, paz: 9, lis: 10, gru: 11, ene: 0, feb: 1, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11, jan: 0, apr: 3, aug: 7, dec: 11, 'fév': 1, fev: 1, avr: 3, mai: 4, juin: 5, juil: 6, 'aoû': 7, aou: 7, 'déc': 11 };
      const shortDateMatch = lower.match(/(\d{1,2})\s+(\w{3,})\.?\s+(\d{4})/);
      if (shortDateMatch) {
        const month = intlMonths[shortDateMatch[2].replace(/\./g, '')];
        if (month !== undefined) {
          return new Date(parseInt(shortDateMatch[3], 10), month, parseInt(shortDateMatch[1], 10)).getTime();
        }
      }

      return null;
    };

    const dated = [];
    const undated = [];
    for (const item of itemsToSort) {
      const t = parseTime(item);
      if (t) dated.push({ item, time: t });
      else undated.push(item);
    }

    dated.sort((a, b) => b.time - a.time);

    if (undated.length === 0) return dated.map((d) => d.item);
    if (dated.length === 0) return undated;

    const ratio = Math.max(1, Math.floor(dated.length / undated.length));
    const merged = [];
    let ui = 0;
    for (let i = 0; i < dated.length; i++) {
      merged.push(dated[i].item);
      if ((i + 1) % ratio === 0 && ui < undated.length) {
        merged.push(undated[ui++]);
      }
    }
    while (ui < undated.length) merged.push(undated[ui++]);
    return merged;
  }, []);

  // Wishlist & filter terms
  const [wishlistTerms, setWishlistTerms] = useState([]);
  const [filterTerms, setFilterTerms] = useState([]);

  // Grid columns control
  const [gridColumns, setGridColumns] = useState(4);

  // Per-platform visibility (toggled from stats bar)
  const [hiddenPlatforms, setHiddenPlatforms] = useState(new Set());

  // Toggle whether filter terms are applied to the grid
  const [showFiltered, setShowFiltered] = useState(false);

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

  // Memoised: apply filter + platform visibility + wishlist marking
  const { visibleItems, wishlistedIds } = useMemo(() => {
    const lowerFilter = showFiltered ? [] : filterTerms.map((t) => t.toLowerCase());
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

    // Remove filter-matched items (unless showFiltered) and hidden platform items
    const filtered = items.filter(
      (item) =>
        !matchesAny(item, lowerFilter) &&
        !hiddenPlatforms.has(item.source)
    );

    const wIds = new Set();
    for (const item of filtered) {
      if (matchesAny(item, lowerWishlist)) {
        wIds.add(item.id || `${item.source}-${item.externalId}`);
      }
    }

    return { visibleItems: filtered, wishlistedIds: wIds };
  }, [items, filterTerms, wishlistTerms, hiddenPlatforms, showFiltered]);

  // ─── (auto-search removed — was for testing only) ───────────

  // ─── Initial parallel search ────────────────────────────────────
  useEffect(() => {
    if (!query) {
      setItems([]);
      setDuplicateGroups([]);
      setPlatformStats({});
      setPages({});
      setMeta(null);
      setPendingItems([]);
      setPageItems({});
      setCurrentPage(1);
      setPreloading(false);
      preloadingRef.current = false;
      return;
    }

    // Cancel any pending search
    if (searchRef.current) {
      searchRef.current.cancelled = true;
    }

    const thisSearch = { cancelled: false };
    searchRef.current = thisSearch;

    const loadItems = () => {
      setLoading(true);
      setError(null);
      setItems([]);
      setPendingItems([]);
      setDuplicateGroups([]);
      setPlatformStats({});
      setExhaustedPlatforms(new Set());

      // Mutable accumulators updated inside SSE callbacks
      const initialPages = {};
      const exhausted = new Set();
      const accumulatedItems = [];

      const abort = crawlSearchStream(
        query,
        selectedPlatforms.length > 0
          ? platformOrder.map((p) => p.id).filter((id) => selectedPlatforms.includes(id))
          : null,
        vintedCountry,
        {
          onQueued: (platforms) => {
            if (thisSearch.cancelled) return;
            const status = {};
            platforms.forEach((p) => { status[p] = "queued"; });
            setPlatformStatus(status);
          },

          onLoading: (platform) => {
            if (thisSearch.cancelled) return;
            setPlatformStatus((prev) => ({ ...prev, [platform]: "loading" }));
          },

          onPlatformResult: ({ platform, items, stat, status }) => {
            if (thisSearch.cancelled) { abort?.(); return; }
            if (items?.length > 0) {
              accumulatedItems.push(...items);
              // Show pending count in loading state but don't display items yet
              setPendingItems([...accumulatedItems]);
            }
            setPlatformStats((prev) => ({ ...prev, [platform]: stat }));
            setPlatformStatus((prev) => ({ ...prev, [platform]: status }));
            initialPages[platform] = 1;
            if (stat.count === 0) exhausted.add(platform);
          },

          onDone: ({ wallTimeMs }) => {
            if (thisSearch.cancelled) return;
            // All platforms finished — sort everything by date and display
            const sorted = sortByDate(accumulatedItems);
            setItems(sorted);
            setPageItems({ 1: sorted });
            setCurrentPage(1);
            setPendingItems([]);
            setPages({ ...initialPages });
            setExhaustedPlatforms(new Set(exhausted));
            setMeta({ wallTimeMs });
            setLoading(false);
          },

          onError: (msg) => {
            if (thisSearch.cancelled) return;
            setError(msg || "Stream connection error");
            const failed = {};
            selectedPlatforms.forEach((p) => { failed[p] = "failed"; });
            setPlatformStatus(failed);
            setLoading(false);
          },
        }
      );

      // Store abort so the cleanup can close the SSE connection
      thisSearch.abort = abort;
    };

    loadItems();

    return () => {
      thisSearch.cancelled = true;
      thisSearch.abort?.(); // Close the SSE stream if still open
    };
  }, [query, queryVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Page-based auto-preload & navigation ────────────────────────

  /**
   * Preload the next page of results in the background.
   * Calls crawlMore for all non-exhausted platforms (except wallapop which has no pagination).
   */
  const preloadPage = useCallback(
    async (pageNum) => {
      if (preloadingRef.current || !query) return;
      preloadingRef.current = true;
      setPreloading(true);

      try {
        // Skip wallapop (infinite scroll, no pages) and exhausted platforms
        const platformsToFetch = Object.keys(pages).filter(
          (p) => !exhaustedPlatforms.has(p) && p !== 'wallapop'
        );

        if (platformsToFetch.length === 0) {
          return;
        }

        // Each platform gets the same page number
        const nextPages = {};
        platformsToFetch.forEach((p) => { nextPages[p] = pageNum; });

        // Gather all existing items across all loaded pages for dedup
        const allExistingItems = Object.values(pageItems).flat();

        const data = await crawlMore(query, platformsToFetch, nextPages, allExistingItems, vintedCountry);

        if (data.newItems?.length > 0) {
          const sortedNew = sortByDate(data.newItems);
          setPageItems((prev) => ({ ...prev, [pageNum]: sortedNew }));
        }

        // Update pages tracking
        setPages((prev) => ({ ...prev, ...nextPages }));

        // Update exhausted platforms
        const newExhausted = new Set(exhaustedPlatforms);
        for (const [platform, stat] of Object.entries(data.platformStats || {})) {
          if (stat.count === 0) newExhausted.add(platform);
          setPlatformStats((prev) => ({
            ...prev,
            [platform]: {
              ...prev[platform],
              page: nextPages[platform],
              totalCount:
                (prev[platform]?.totalCount || prev[platform]?.count || 0) + stat.count,
            },
          }));
        }
        setExhaustedPlatforms(newExhausted);

        if (data.duplicateGroups) {
          setDuplicateGroups(data.duplicateGroups);
        }
      } catch (err) {
        console.error("Preload page error:", err);
      } finally {
        preloadingRef.current = false;
        setPreloading(false);
      }
    },
    [query, pages, pageItems, exhaustedPlatforms, vintedCountry, sortByDate]
  );

  /**
   * Navigate to a specific page.
   * Shows that page's items and triggers preload of the next page.
   */
  const goToPage = useCallback(
    (pageNum) => {
      if (!pageItems[pageNum]?.length) return;
      setItems(pageItems[pageNum]);
      setCurrentPage(pageNum);
    },
    [pageItems]
  );

  /**
   * Auto-preload effect:
   * When the user is on a loaded page and the next page hasn't been loaded yet,
   * automatically start preloading it in the background.
   * Condition: current page loaded + next page not loaded + not already preloading + not all exhausted
   */
  // Wallapop is always "exhausted" for pagination (infinite scroll, no pages)
  const allExhausted =
    Object.keys(pages).length > 0 &&
    Object.keys(pages).every((p) => exhaustedPlatforms.has(p) || p === 'wallapop');

  useEffect(() => {
    if (loading || preloading) return;
    if (!query) return;

    const nextPage = currentPage + 1;
    const currentPageLoaded = pageItems[currentPage]?.length > 0;
    const nextPageExists = pageItems[nextPage] !== undefined;

    // Only preload next page if current is loaded and next doesn't exist yet
    if (currentPageLoaded && !nextPageExists && !allExhausted) {
      preloadPage(nextPage);
    }
  }, [currentPage, pageItems, loading, preloading, query, allExhausted, preloadPage]);

  // ─── Duplicate panel handlers ───────────────────────────────────
  const handleDuplicateClick = (item) => {
    setSelectedDuplicateItem(item);
  };

  const closeDuplicatePanel = () => {
    setSelectedDuplicateItem(null);
  };

  // Toggle a platform's items on/off in the grid
  const togglePlatformVisibility = (platform) => {
    setHiddenPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  };

  // ─── Platform stats bar ─────────────────────────────────────────

  return (
    <>
      {/* Platform sidebar */}
      <aside
        className={`shrink-0 transition-all duration-200 relative flex flex-col ${
          sidebarCollapsed ? "w-14" : ""
        }`}
        style={sidebarCollapsed ? { minHeight: 0, maxHeight: '100%' } : { width: sidebarWidth, minHeight: 0, maxHeight: '100%' }}
      >
        {/* ── Layer 0: GlassSurface background ── */}
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={0}
          backgroundOpacity={0.10}
          blur={14}
          saturation={1.3}
          distortionScale={-120}
          displace={0}
          className="!absolute !inset-0"
        />

        {/* ── Layer 1: Scrollable content ── */}
        <div className="relative z-10 flex-1 overflow-y-auto min-h-0 glass-scroll">
          <PlatformSidebar
            selectedPlatforms={selectedPlatforms}
            onPlatformsChange={setSelectedPlatforms}
            vintedCountry={vintedCountry}
            onVintedCountryChange={setVintedCountry}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            platformStatus={platformStatus}
            platformOrder={platformOrder}
            onPlatformOrderChange={setPlatformOrder}
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
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary-400/50 active:bg-primary-500/60 transition-colors z-20"
          />
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto glass-scroll">
        <div className="w-full flex flex-col py-5 gap-5 px-8">
          {/* Search meta info */}
          {meta && items.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-sm glass-text">
              <span className="font-semibold">
                {visibleItems.length} items
                {visibleItems.length !== items.length && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({items.length - visibleItems.length} filtered)
                  </span>
                )}
              </span>
              <Circle className="w-1.5 h-1.5 fill-current opacity-70" />
              <span>{meta.wallTimeMs}ms</span>
              <Circle className="w-1.5 h-1.5 fill-current opacity-70" />
              <span className="inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Parallel search
              </span>
              {duplicateGroups.length > 0 && (
                <>
                  <Circle className="w-1.5 h-1.5 fill-current opacity-70" />
                  <span className="text-amber-500 font-medium inline-flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" />
                    {duplicateGroups.length} duplicate group
                    {duplicateGroups.length > 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Platform stats bar */}
          {Object.keys(platformStats).length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {/* "Show Filtered" toggle */}
              {filterTerms.length > 0 && (
                <button
                  onClick={() => setShowFiltered((prev) => !prev)}
                  className={`glass-chip text-xs px-3 py-1.5 font-medium transition-colors ${
                    showFiltered
                      ? "!border-amber-400 text-amber-700 dark:text-amber-300"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    {showFiltered ? "Hide Filtered" : "Show Filtered"}
                  </span>
                </button>
              )}

              {/* Per-platform chips */}
              {Object.entries(platformStats).map(([platform, stat]) => {
                const config = platformOrder.find((p) => p.id === platform);
                const isHidden = hiddenPlatforms.has(platform);
                const isExhausted = exhaustedPlatforms.has(platform);
                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatformVisibility(platform)}
                    title={isHidden ? `Show ${platform} items` : `Hide ${platform} items`}
                    className={`glass-chip flex items-center gap-1.5 text-xs px-2.5 py-1.5 font-medium transition-all ${
                      isHidden
                        ? "opacity-50 line-through"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {config && (
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <img src={config.icon} alt={platform} className="max-w-full max-h-full object-contain" />
                      </span>
                    )}
                    <span>{platform}</span>
                    <span className="opacity-70">· {stat.totalCount ?? stat.count}</span>
                    {isExhausted && !isHidden && (
                      <Check className="w-3.5 h-3.5 text-green-500 ml-0.5" />
                    )}
                  </button>
                );
              })}
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
                      ? "glass-btn-primary text-white shadow-md"
                      : "glass-chip text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {cols}
                </button>
              ))}
            </div>
          )}

          {/* Item grid */}
          {visibleItems.length > 0 && (
            <GridCards columns={gridColumns}>
              {visibleItems.map((item, i) => (
                <CardItem
                  key={item.id || `${item.source}-${i}`}
                  item={item}
                  isWishlisted={wishlistedIds.has(item.id || `${item.source}-${item.externalId}`)}
                  onDuplicateClick={handleDuplicateClick}
                />
              ))}
            </GridCards>
          )}

          {/* Page navigation */}
          {visibleItems.length > 0 && (
            <div className="flex justify-center items-center gap-3 py-6">
              {/* Page buttons */}
              <div className="flex items-center gap-1.5">
                {Object.keys(pageItems)
                  .map(Number)
                  .sort((a, b) => a - b)
                  .filter((p) => pageItems[p]?.length > 0)
                  .map((pageNum) => {
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all duration-200 ${
                          isActive
                            ? "glass-btn glass-btn-primary shadow-lg scale-110"
                            : "glass-chip text-text-secondary hover:text-text-primary hover:scale-105"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
              </div>

              {/* Preloading indicator */}
              {preloading && (
                <span className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 ml-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading page {Math.max(...Object.keys(pageItems).map(Number)) + 1}…
                </span>
              )}
            </div>
          )}

          {/* All exhausted message */}
          {allExhausted && visibleItems.length > 0 && !preloading && (
            <p className="text-center text-sm glass-text py-4 inline-flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              All platforms have been fully loaded across {Object.keys(pageItems).filter(k => pageItems[k]?.length > 0).length} page{Object.keys(pageItems).filter(k => pageItems[k]?.length > 0).length > 1 ? 's' : ''}.
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
                <span className="inline-flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-500" />
                  Searching all platforms in parallel...
                </span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pendingItems.length > 0
                  ? `${pendingItems.length} items found so far — waiting for all platforms to finish…`
                  : "This may take 30-60 seconds while browsers load"}
              </p>
              {/* Per-platform progress */}
              {Object.keys(platformStatus).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {Object.entries(platformStatus).map(([platform, status]) => {
                    const config = platformOrder.find((p) => p.id === platform);
                    return (
                      <span
                        key={platform}
                        className={`glass-chip flex items-center gap-1.5 text-xs px-2.5 py-1 font-medium ${
                          status === "done" || status === "empty"
                            ? "text-green-600 dark:text-green-400"
                            : status === "loading"
                            ? "text-blue-600 dark:text-blue-400"
                            : status === "failed"
                            ? "text-red-600 dark:text-red-400"
                            : "text-text-disabled"
                        }`}
                      >
                        {config && (
                          <img src={config.icon} alt={platform} className="w-4 h-4 object-contain" />
                        )}
                        {platform}
                        {status === "loading" && (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        )}
                        {(status === "done" || status === "empty") && <Check className="w-3 h-3" />}
                        {status === "failed" && <X className="w-3 h-3" />}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {!visibleItems.length && !query && (
            <div className="flex flex-col items-center justify-center py-16 gap-8 max-w-2xl mx-auto">
              {/* Hero icon / illustration */}
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl glass-surface flex items-center justify-center" style={{ backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-md">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Headline */}
              <div className="text-center space-y-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                  Search across <span className="text-primary-500">8 marketplaces</span> at once
                </h1>
                <p className="text-base text-text-secondary max-w-md mx-auto leading-relaxed">
                  Find the best deals on collectibles, electronics, and more — all in one place. Results from every platform, sorted by date.
                </p>
              </div>

              {/* Platform grid */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {platformOrder.map((platform) => (
                  <div
                    key={platform.id}
                    className="glass-chip flex items-center gap-2 px-4 py-2.5 group"
                  >
                    <img
                      src={platform.icon}
                      alt={platform.label}
                      className="w-5 h-5 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                      {platform.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-2">
                <div className="flex flex-col items-center gap-2 p-5 rounded-2xl glass-surface-light">
                  <Search className="w-6 h-6 text-primary-500" />
                  <span className="text-sm font-semibold text-text-primary">Parallel Search</span>
                  <span className="text-xs text-text-secondary text-center">All platforms searched simultaneously</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-5 rounded-2xl glass-surface-light">
                  <CalendarDays className="w-6 h-6 text-primary-500" />
                  <span className="text-sm font-semibold text-text-primary">Date Sorted</span>
                  <span className="text-xs text-text-secondary text-center">Newest listings appear first</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-5 rounded-2xl glass-surface-light">
                  <Copy className="w-6 h-6 text-primary-500" />
                  <span className="text-sm font-semibold text-text-primary">Duplicate Detection</span>
                  <span className="text-xs text-text-secondary text-center">Cross-platform duplicates flagged</span>
                </div>
              </div>

              {/* Subtle hint */}
              <p className="text-xs text-text-disabled mt-2">
                Type in the search bar above to get started
              </p>
            </div>
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
