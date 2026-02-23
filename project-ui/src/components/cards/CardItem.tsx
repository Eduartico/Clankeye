import React from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ImageCarousel from "./ImageCarousel";
import PlatformBadge from "./PlatformBadge";
import DuplicateBadge from "./DuplicateBadge";
import { normalizePrice } from "../../utils/priceUtils";

interface CardItemProps {
  item: any;
  isWishlisted?: boolean;
  onDuplicateClick?: (item: any) => void;
}
export default function CardItem({ item, isWishlisted, onDuplicateClick }: CardItemProps) {
  // Normalise image data: scrapers may return `image` (string) or `photos` (array)
  const images: string[] = item.photos?.length
    ? item.photos.map((p: any) => (typeof p === "string" ? p : p?.url || p?.full_size_url || "")).filter(Boolean)
    : item.image
    ? [item.image]
    : [];

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 0 || event.button === 1) {
      // Left-click (0) or Middle-click (1)
      const newTab = window.open(item.url, "_blank");
      if (newTab) {
        newTab.opener = null; // Prevents potential security vulnerabilities
      }
    }
  };

  return (
    <div className={`relative w-full max-w-[420px] h-[450px] bg-white dark:bg-zinc-900 rounded-3xl p-5 group hover:scale-[1.02] transition ease-in-out duration-150 border-2 border-gray-300 dark:border-[#393939] hover:shadow-lg hover:shadow-primary-500 ${
      isWishlisted ? "wishlist-glow" : ""
    }`}>
      {/* Duplicate badge (top-right) */}
      {item.duplicateGroupId && (
        <DuplicateBadge
          duplicateCount={item.duplicateCount}
          duplicatePlatforms={item.duplicatePlatforms || []}
          currentPlatform={item.source}
          onClick={() => onDuplicateClick?.(item)}
        />
      )}

      <div className="w-full h-full flex flex-col gap-4">
        <ImageCarousel images={images} />
        <div className="h-full flex flex-col justify-between gap-2">
          <div className="flex flex-col gap-1">
            {/* Platform badge */}
            {item.source && (
              <div className="flex">
                <PlatformBadge platform={item.source} />
              </div>
            )}
            <h5 className="text-2xl font-bold text-wrap break-all min-h-24 h-24 overflow-y-auto tracking-tight text-slate-900 dark:text-white">
              {item.title}
            </h5>
          </div>

          <div className="h-full flex px-5 items-center justify-between text-3xl font-bold text-wrap break-all overflow-y-auto tracking-tight text-slate-900 dark:text-primary-500">
            <h5>{normalizePrice(item.price).display}</h5>
            <div
              className="text-primary-500 transition ease-in-out duration-150 cursor-pointer hover:text-primary-600"
              onMouseDown={handleClick}
            >
              <OpenInNewIcon sx={{ fontSize: 30 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
