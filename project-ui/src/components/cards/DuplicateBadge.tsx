import React from "react";

/**
 * Platform icon/color mapping
 */
const PLATFORM_COLORS: Record<string, string> = {
  ebay: "bg-blue-500",
  vinted: "bg-teal-500",
  "olx-pt": "bg-yellow-500",
  "olx-br": "bg-orange-500",
  "olx-pl": "bg-yellow-600",
  wallapop: "bg-emerald-500",
  todocoleccion: "bg-red-500",
  leboncoin: "bg-orange-400",
};

const PLATFORM_LABELS: Record<string, string> = {
  ebay: "eBay",
  vinted: "Vinted",
  "olx-pt": "OLX PT",
  "olx-br": "OLX BR",
  "olx-pl": "OLX PL",
  wallapop: "Wallapop",
  todocoleccion: "Todocoleccion",
  leboncoin: "Leboncoin",
};

interface DuplicateBadgeProps {
  duplicateCount: number;
  duplicatePlatforms: string[];
  currentPlatform?: string;
  onClick?: () => void;
}

/**
 * Badge shown on card items that have duplicates on other platforms.
 * Shows the count and platform names.
 */
export default function DuplicateBadge({
  duplicateCount,
  duplicatePlatforms,
  currentPlatform,
  onClick,
}: DuplicateBadgeProps) {
  // Filter out the current platform to show "also on X, Y"
  const otherPlatforms = duplicatePlatforms.filter(
    (p) => p !== currentPlatform
  );

  if (otherPlatforms.length === 0) return null;

  return (
    <div
      onClick={onClick}
      className="absolute top-3 right-3 z-10 cursor-pointer group/dup"
      title={`Also found on: ${otherPlatforms
        .map((p) => PLATFORM_LABELS[p] || p)
        .join(", ")}`}
    >
      {/* Badge pill */}
      <div className="flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg hover:bg-amber-600 transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <span>{duplicateCount}</span>
      </div>

      {/* Tooltip on hover */}
      <div className="invisible group-hover/dup:visible absolute top-full right-0 mt-1 w-48 bg-zinc-800 text-white text-xs rounded-lg p-2 shadow-xl z-20">
        <p className="font-semibold mb-1">Also found on:</p>
        <div className="flex flex-wrap gap-1">
          {otherPlatforms.map((platform) => (
            <span
              key={platform}
              className={`${
                PLATFORM_COLORS[platform] || "bg-gray-500"
              } text-white px-2 py-0.5 rounded-full text-[10px] font-medium`}
            >
              {PLATFORM_LABELS[platform] || platform}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
