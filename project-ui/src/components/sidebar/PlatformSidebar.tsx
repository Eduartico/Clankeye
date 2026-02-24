import React, { useState, useRef, useCallback } from "react";
import EbayIcon         from "../../assets/PlatformIcons/ebay.png";
import LeboncoinIcon    from "../../assets/PlatformIcons/leboncoin.png";
import OlxBrIcon        from "../../assets/PlatformIcons/olxbr.png";
import OlxPlIcon        from "../../assets/PlatformIcons/olxpl.png";
import OlxPtIcon        from "../../assets/PlatformIcons/olxpt.png";
import TodocoleccionIcon from "../../assets/PlatformIcons/todocoleccion.png";
import VintedIcon       from "../../assets/PlatformIcons/vinted.png";
import WallapopIcon     from "../../assets/PlatformIcons/wallapop.png";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlatformSearchStatus = "idle" | "queued" | "loading" | "done" | "empty" | "failed";

export interface PlatformConfig {
  id: string;
  label: string;
  country: string;
  icon: string;
  hasCountry?: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const DEFAULT_PLATFORM_CONFIGS: PlatformConfig[] = [
  { id: "olx-pt",        label: "OLX Portugal",    country: "PT", icon: OlxPtIcon },
  { id: "olx-br",        label: "OLX Brazil",      country: "BR", icon: OlxBrIcon },
  { id: "olx-pl",        label: "OLX Poland",      country: "PL", icon: OlxPlIcon },
  { id: "vinted",        label: "Vinted",           country: "PT", icon: VintedIcon, hasCountry: true },
  { id: "ebay",          label: "eBay",             country: "US", icon: EbayIcon },
  { id: "wallapop",      label: "Wallapop",         country: "ES", icon: WallapopIcon },
  { id: "todocoleccion", label: "Todocoleccion",    country: "ES", icon: TodocoleccionIcon },
  { id: "leboncoin",     label: "Leboncoin",        country: "FR", icon: LeboncoinIcon },
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
  /** Current ordering of platforms (array of PlatformConfig) */
  platformOrder: PlatformConfig[];
  /** Called when the user reorders platforms via drag-and-drop */
  onPlatformOrderChange: (newOrder: PlatformConfig[]) => void;
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
  platformOrder,
  onPlatformOrderChange,
}: PlatformSidebarProps) {
  const allSelected = selectedPlatforms.length === platformOrder.length;

  // ── Drag-and-drop state ──────────────────────────────────────
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = useCallback((idx: number) => {
    dragItem.current = idx;
    setDraggingIdx(idx);
  }, []);

  const handleDragEnter = useCallback((idx: number) => {
    dragOverItem.current = idx;
    setDragOverIdx(idx);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const reordered = [...platformOrder];
      const [removed] = reordered.splice(dragItem.current, 1);
      reordered.splice(dragOverItem.current, 0, removed);
      onPlatformOrderChange(reordered);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  }, [platformOrder, onPlatformOrderChange]);

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
      onPlatformsChange(platformOrder.map((p) => p.id));
    }
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 px-2">
        <button
          onClick={onToggleCollapse}
          className="glass-btn glass-btn-ghost p-2 rounded-xl"
          title="Expand platforms"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {platformOrder.map((platform) => {
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
                <span className="w-6 h-6 flex items-center justify-center">
                  <img src={platform.icon} alt={platform.label} className="max-w-full max-h-full object-contain" />
                </span>
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
    <div className="flex flex-col gap-3 p-4 overflow-y-auto glass-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
          Platforms
        </h3>
        <button
          onClick={onToggleCollapse}
          className="glass-btn glass-btn-ghost p-1 rounded-lg"
          title="Collapse sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Select All */}
      <label className="flex items-center gap-2 cursor-pointer group pb-2 border-b border-white/10 dark:border-white/5">
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
          {selectedPlatforms.length}/{platformOrder.length}
        </span>
      </label>

      {/* Platform list — drag-to-reorder */}
      <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 glass-scroll">
        {platformOrder.map((platform, idx) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const status = platformStatus[platform.id] ?? "idle";
          const isDragging = draggingIdx === idx;
          const isDragOver = dragOverIdx === idx && draggingIdx !== idx;
          return (
            <div
              key={platform.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all cursor-grab active:cursor-grabbing ${
                isDragging
                  ? "opacity-40 scale-95"
                  : isDragOver
                  ? "border-t-2 border-primary-500"
                  : ""
              } ${
                isSelected
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {/* Drag handle */}
              <span className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 shrink-0 cursor-grab" title="Drag to reorder">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                </svg>
              </span>
              {/* Checkbox + icon + label — clicking toggles platform */}
              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePlatform(platform.id)}
                  className="w-4 h-4 rounded accent-primary-500 cursor-pointer shrink-0"
                />
                <span className="w-5 h-5 flex items-center justify-center shrink-0">
                  <img
                    src={platform.icon}
                    alt={platform.label}
                    className="max-w-full max-h-full object-contain"
                  />
                </span>
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

              {/* Vinted country — sits LEFT of status icon, outside label so it doesn't toggle checkbox */}
              {platform.hasCountry && isSelected && (
                <select
                  value={vintedCountry}
                  onChange={(e) => { e.stopPropagation(); onVintedCountryChange(e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  title={`vinted.${vintedCountry}`}
                  className="glass-input shrink-0 text-xs px-1 py-0.5 w-[52px] !rounded-lg font-medium cursor-pointer"
                >
                  {VINTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>.{c.code}</option>
                  ))}
                </select>
              )}

              {/* Status icon */}
              <StatusIcon status={status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
