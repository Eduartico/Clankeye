import React from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ImageCarousel from "./ImageCarousel";
import PlatformBadge from "./PlatformBadge";
import DuplicateBadge from "./DuplicateBadge";
import { GlassCard } from "../glass";
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
      const newTab = window.open(item.url, "_blank");
      if (newTab) newTab.opener = null;
    }
  };

  return (
    /* Outer wrapper carries wishlist-glow so the shimmer isn't clipped by GlassCard's overflow:hidden */
    <div className={`relative w-full rounded-[24px] ${isWishlisted ? "wishlist-glow" : ""}`}>
      <GlassCard variant="surface" className="w-full group">
        {/* ── Image section: fills full width, height determined by aspect-ratio ─ */}
        <div className="relative w-full overflow-hidden rounded-t-[23px]" style={{ aspectRatio: '4/3', minHeight: '160px' }}>
          <ImageCarousel images={images} />

          {/* Platform badge — overlaid bottom-left of image */}
          {item.source && (
            <div className="absolute bottom-2 left-2 z-10">
              <PlatformBadge platform={item.source} />
            </div>
          )}

          {/* Duplicate badge — overlaid top-right of image */}
          {item.duplicateGroupId && (
            <DuplicateBadge
              duplicateCount={item.duplicateCount}
              duplicatePlatforms={item.duplicatePlatforms || []}
              currentPlatform={item.source}
              onClick={() => onDuplicateClick?.(item)}
            />
          )}
        </div>

        {/* ── Info section (compact, below image) ───────────────────── */}
        <div className="shrink-0 px-4 py-3 flex flex-col gap-1 border-t border-white/10 dark:border-white/5 rounded-b-[23px]">
          <h5 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
            {item.title}
          </h5>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-lg font-bold tracking-tight text-primary-500">
              {normalizePrice(item.price).display}
            </span>
            <div
              className="text-primary-500 transition ease-in-out duration-150 cursor-pointer hover:text-primary-600"
              onMouseDown={handleClick}
            >
              <OpenInNewIcon sx={{ fontSize: 22 }} />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
