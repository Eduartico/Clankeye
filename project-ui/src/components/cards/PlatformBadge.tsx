import React from "react";
import EbayIcon         from "../../assets/PlatformIcons/ebay.png";
import LeboncoinIcon    from "../../assets/PlatformIcons/leboncoin.png";
import OlxBrIcon        from "../../assets/PlatformIcons/olxbr.png";
import OlxPlIcon        from "../../assets/PlatformIcons/olxpl.png";
import OlxPtIcon        from "../../assets/PlatformIcons/olxpt.png";
import TodocoleccionIcon from "../../assets/PlatformIcons/todocoleccion.png";
import VintedIcon       from "../../assets/PlatformIcons/vinted.png";
import WallapopIcon     from "../../assets/PlatformIcons/wallapop.png";

const PLATFORM_ICONS: Record<string, string> = {
  ebay:          EbayIcon,
  vinted:        VintedIcon,
  "olx-pt":      OlxPtIcon,
  "olx-br":      OlxBrIcon,
  "olx-pl":      OlxPlIcon,
  wallapop:      WallapopIcon,
  todocoleccion: TodocoleccionIcon,
  leboncoin:     LeboncoinIcon,
};

const PLATFORM_LABELS: Record<string, string> = {
  ebay:          "eBay",
  vinted:        "Vinted",
  "olx-pt":      "OLX PT",
  "olx-br":      "OLX BR",
  "olx-pl":      "OLX PL",
  wallapop:      "Wallapop",
  todocoleccion: "Todocoleccion",
  leboncoin:     "Leboncoin",
};

interface PlatformBadgeProps {
  platform: string;
}

/**
 * Platform badge shown overlaid on item images — icon + label on a frosted pill.
 */
export default function PlatformBadge({ platform }: PlatformBadgeProps) {
  const icon = PLATFORM_ICONS[platform];
  return (
    <span className="inline-flex items-center gap-1 bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow">
      {icon && (
        <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
          <img
            src={icon}
            alt={platform}
            className="max-w-full max-h-full object-contain"
          />
        </span>
      )}
      {PLATFORM_LABELS[platform] || platform}
    </span>
  );
}
