import React from "react";

const PLATFORM_COLORS: Record<string, string> = {
  ebay: "bg-blue-500",
  vinted: "bg-teal-500",
  "olx-pt": "bg-yellow-500 text-black",
  "olx-br": "bg-orange-500",
  "olx-pl": "bg-yellow-600 text-black",
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

interface PlatformBadgeProps {
  platform: string;
}

/**
 * Small colored badge showing which platform an item came from
 */
export default function PlatformBadge({ platform }: PlatformBadgeProps) {
  return (
    <span
      className={`${
        PLATFORM_COLORS[platform] || "bg-gray-500"
      } text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide`}
    >
      {PLATFORM_LABELS[platform] || platform}
    </span>
  );
}
