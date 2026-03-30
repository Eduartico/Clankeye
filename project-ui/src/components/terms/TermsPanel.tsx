import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getWishlistTerms,
  addWishlistTerm,
  removeWishlistTerm,
  getFilterTerms,
  addFilterTerm,
  removeFilterTerm,
} from "../../services/api";

// ─── Icons (inline SVG to avoid extra deps) ────────────────────

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
    </svg>
  );
}

function FilterIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Term chip with count ───────────────────────────────────────

interface TermChipProps {
  term: string;
  count: number;
  variant: "wishlist" | "filter";
  onRemove: (term: string) => void;
}

function TermChip({ term, count, variant, onRemove }: TermChipProps) {
  const colors =
    variant === "wishlist"
      ? "!border-amber-400/40 text-amber-700 dark:text-amber-300"
      : "!border-red-400/40 text-red-700 dark:text-red-300";

  return (
    <span
      className={`glass-chip inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium ${colors} transition-all`}
    >
      {variant === "wishlist" ? (
        <StarIcon className="w-3 h-3 text-amber-500" />
      ) : (
        <FilterIcon className="w-3 h-3 text-red-500" />
      )}
      <span className="max-w-[120px] truncate">{term}</span>
      {count > 0 && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-black/30 text-[10px] font-bold leading-none">
          {count}
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(term);
        }}
        className="ml-0.5 hover:text-red-600 dark:hover:text-red-400 font-bold text-sm leading-none"
        title={`Remove "${term}"`}
      >
        ×
      </button>
    </span>
  );
}

// ─── Input row ──────────────────────────────────────────────────

interface AddTermInputProps {
  placeholder: string;
  onAdd: (term: string) => void;
}

function AddTermInput({ placeholder, onAdd }: AddTermInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="glass-input flex-1 min-w-0 px-2 py-1 text-xs !rounded-lg"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="glass-btn glass-btn-primary px-2 py-1 text-xs !rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
      >
        +
      </button>
    </form>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────

interface TermsPanelProps {
  /** All items currently in the grid (BEFORE filtering) */
  items: any[];
  /** Callback to pass term arrays up to the parent for filtering/highlighting */
  onTermsChange?: (wishlist: string[], filter: string[]) => void;
}

export default function TermsPanel({ items, onTermsChange }: TermsPanelProps) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [filter, setFilter] = useState<string[]>([]);
  const [wishlistOpen, setWishlistOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(true);

  // Load terms from backend on mount
  useEffect(() => {
    getWishlistTerms().then(setWishlist).catch(() => {});
    getFilterTerms().then(setFilter).catch(() => {});
  }, []);

  // Notify parent whenever terms change
  useEffect(() => {
    onTermsChange?.(wishlist, filter);
  }, [wishlist, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Count how many items match each term ──────────────────────

  const countMatches = useCallback(
    (term: string): number => {
      const lower = term.toLowerCase();
      return items.filter((item) => {
        const searchable = [
          item.title || "",
          item.description || "",
          item.category || "",
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(lower);
      }).length;
    },
    [items]
  );

  // ─── CRUD handlers ────────────────────────────────────────────

  const handleAddWishlist = async (term: string) => {
    const updated = await addWishlistTerm(term);
    setWishlist(updated);
  };

  const handleRemoveWishlist = async (term: string) => {
    const updated = await removeWishlistTerm(term);
    setWishlist(updated);
  };

  const handleAddFilter = async (term: string) => {
    const updated = await addFilterTerm(term);
    setFilter(updated);
  };

  const handleRemoveFilter = async (term: string) => {
    const updated = await removeFilterTerm(term);
    setFilter(updated);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Wishlist Section ────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setWishlistOpen(!wishlistOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline w-full"
        >
          <StarIcon className="w-3.5 h-3.5" />
          Wishlist ({wishlist.length})
          <span className="ml-auto text-[10px] text-gray-400">
            {wishlistOpen ? "▾" : "▸"}
          </span>
        </button>

        {wishlistOpen && (
          <div className="mt-1.5 flex flex-col gap-1.5">
            <AddTermInput
              placeholder="Add wishlist term…"
              onAdd={handleAddWishlist}
            />
            {wishlist.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {wishlist.map((term) => (
                  <TermChip
                    key={term}
                    term={term}
                    count={countMatches(term)}
                    variant="wishlist"
                    onRemove={handleRemoveWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Filter Section ──────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline w-full"
        >
          <FilterIcon className="w-3.5 h-3.5" />
          Filter ({filter.length})
          <span className="ml-auto text-[10px] text-gray-400">
            {filterOpen ? "▾" : "▸"}
          </span>
        </button>

        {filterOpen && (
          <div className="mt-1.5 flex flex-col gap-1.5">
            <AddTermInput
              placeholder="Add filter term…"
              onAdd={handleAddFilter}
            />
            {filter.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filter.map((term) => (
                  <TermChip
                    key={term}
                    term={term}
                    count={countMatches(term)}
                    variant="filter"
                    onRemove={handleRemoveFilter}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
