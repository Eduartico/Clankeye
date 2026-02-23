import React from "react";
import PlaceholderIcon from "../../assets/mando.png";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlatformSearchStatus = "idle" | "queued" | "loading" | "done" | "empty" | "failed";

// ─── Data ────────────────────────────────────────────────────────────────────

export const PLATFORM_CONFIGS = [
  { id: "olx-pt",        label: "OLX Portugal",    country: "PT", icon: PlaceholderIcon },
  { id: "olx-br",        label: "OLX Brazil",      country: "BR", icon: PlaceholderIcon },
  { id: "olx-pl",        label: "OLX Poland",      country: "PL", icon: PlaceholderIcon },
  { id: "vinted",        label: "Vinted",           country: "PT", icon: PlaceholderIcon, hasCountry: true },
  { id: "ebay",          label: "eBay",             country: "US", icon: PlaceholderIcon },
  { id: "wallapop",      label: "Wallapop",         country: "ES", icon: PlaceholderIcon },
  { id: "todocoleccion", label: "Todocoleccion",    country: "ES", icon: PlaceholderIcon },
  { id: "leboncoin",     label: "Leboncoin",        country: "FR", icon: PlaceholderIcon },
];

export const VINTED_COUNTRIES = [
  { code: "pt", label: "Portugal" },
  { code: "fr", label: "France" },
  { code: "es", label: "Spain" },
  { code: "de", label: "Germany" },
  { code: "it", label: "Italy" },
  { code: "nl", label: "Netherlands" },
  { code: "be", label: "Belgium" },
  { code: "uk", label: "United Kingdom" },
  { code: "pl", label: "Poland" },
  { code: "lt", label: "Lithuania" },
  { code: "cz", label: "Czech Republic" },
];

// ─── Status icon ─────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: PlatformSearchStatus }) {
  if (status === "idle") return null;

  if (status === "queued")
    return (
      <span title="In queue">
        <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    );

  if (status === "loading")
    return (
      <span title="Searching\u2026">
        <svg className="w-3.5 h-3.5 text-primary-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </span>
    );

  if (status === "done")
    return (
      <span title="Results found">
        <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );

  if (status === "empty")
    return (
      <span title="No results">
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
        </svg>
      </span>
    );

  if (status === "failed")
    return (
      <span title="Search failed">
        <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    );

  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────


interface PlatformSidebarProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
  vintedCountry: string;
  onVintedCountryChange: (country: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Per-platform search status to display icons */
  platformStatus?: Record<string, PlatformSearchStatus>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PlatformSidebar({
  selectedPlatforms,
  onPlatformsChange,
  vintedCountry,
  onVintedCountryChange,
  collapsed = false,
  onToggleCollapse,
  platformStatus = {},
}: PlatformSidebarProps) {
  const allSelected = selectedPlatforms.length === PLATFORM_CONFIGS.length;

  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      onPlatformsChange(selectedPlatforms.filter((p) => p !== id));
    } else {
      onPlatformsChange([...selectedPlatforms, id]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onPlatformsChange([]);
    } else {
      onPlatformsChange(PLATFORM_CONFIGS.map((p) => p.id));
    }
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 px-2">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="Expand platforms"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {PLATFORM_CONFIGS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const status = platformStatus[platform.id] ?? "idle";
          return (
            <div key={platform.id} className="relative">
              <button
                onClick={() => togglePlatform(platform.id)}
                className={`p-1.5 rounded-lg transition-all ${
                  isSelected ? "ring-2 ring-primary-500 opacity-100" : "opacity-40 hover:opacity-70"
                }`}
                title={platform.label}
              >
                <img src={platform.icon} alt={platform.label} className="w-6 h-6" />
              </button>
              {status !== "idle" && (
                <span className="absolute -bottom-1 -right-1">
                  <StatusIcon status={status} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
          Platforms
        </h3>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="Collapse sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Select All */}
      <label className="flex items-center gap-2 cursor-pointer group pb-2 border-b border-zinc-200 dark:border-zinc-700">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="w-4 h-4 rounded accent-primary-500 cursor-pointer"
        />
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
          Select All
        </span>
        <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
          {selectedPlatforms.length}/{PLATFORM_CONFIGS.length}
        </span>
      </label>

      {/* Platform list */}
      <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
        {PLATFORM_CONFIGS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const status = platformStatus[platform.id] ?? "idle";
          return (
            <div
              key={platform.id}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${
                isSelected
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {/* Checkbox + icon + label — clicking toggles platform */}
              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePlatform(platform.id)}
                  className="w-4 h-4 rounded accent-primary-500 cursor-pointer shrink-0"
                />
                <img
                  src={platform.icon}
                  alt={platform.label}
                  className="w-5 h-5 rounded shrink-0"
                />
                <span
                  className={`text-sm truncate transition-colors ${
                    isSelected
                      ? "text-zinc-900 dark:text-white font-medium"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {platform.label}
                </span>
              </label>

              {/* Status icon */}
              <StatusIcon status={status} />

              {/* Vinted country — inline on SAME ROW, outside label so it doesn't toggle checkbox */}
              {platform.hasCountry && isSelected && (
                <select
                  value={vintedCountry}
                  onChange={(e) => { e.stopPropagation(); onVintedCountryChange(e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  title={`vinted.${vintedCountry}`}
                  className="shrink-0 text-xs px-1 py-0.5 w-11 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 focus:ring-1 focus:ring-primary-500 focus:outline-none cursor-pointer"
                >
                  {VINTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>.{c.code}</option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
