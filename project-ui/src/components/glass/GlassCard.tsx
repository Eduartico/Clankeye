/**
 * GlassCard — Interactive card surface.
 *
 * Height is always auto (grows with content).
 * Use for: item cards, feature tiles, info panels.
 *
 * Variants:
 *   surface  — CSS-only glass (lightweight, no SVG filter — ideal for grids of 100+ cards)
 *   elevated — Full GlassSurface with SVG displacement + primary glow
 *   flat     — Minimal, no blur (for nesting)
 *
 * The `surface` variant was switched from GlassSurface (SVG) to pure CSS
 * backdrop-filter to eliminate per-card ResizeObserver + SVG filter overhead
 * that caused lag with many cards.
 */
import React from "react";
import GlassSurface from "../ui/GlassSurface";

export type GlassCardVariant = "surface" | "elevated" | "flat";

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  borderRadius?: number;
  /** Extra class applied to the container */
  className?: string;
  /** Extra class applied to the content wrapper */
  contentClassName?: string;
  style?: React.CSSProperties;
}

const hoverBase = [
  "hover:border-[rgba(var(--color-primary-rgb,249,115,22),0.25)]",
  "hover:-translate-y-0.5",
  "hover:shadow-[0_8px_32px_rgba(var(--color-primary-rgb,249,115,22),0.14),0_12px_40px_rgba(0,0,0,0.15)]",
].join(" ");

export function GlassCard({
  children,
  variant = "surface",
  borderRadius = 24,
  className = "",
  contentClassName = "",
  style,
}: GlassCardProps) {

  /* ── Surface variant: lightweight CSS-only glass (no SVG, no ResizeObserver) ── */
  if (variant === "surface" || variant === "flat") {
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    const bg = variant === "flat"
      ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.18)")
      : (isDark ? "rgba(10,15,30,0.40)" : "rgba(255,255,255,0.38)");
    const blur = variant === "flat" ? 0 : 12;
    const border = isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.35)";
    const shadow = isDark
      ? "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.18)"
      : "inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.05)";

    return (
      <div
        className={[
          "relative overflow-hidden",
          "transition-all duration-200",
          variant === "flat" ? "" : hoverBase,
          className,
        ].filter(Boolean).join(" ")}
        style={{
          borderRadius: `${borderRadius}px`,
          background: bg,
          backdropFilter: blur ? `blur(${blur}px) saturate(1.3)` : undefined,
          WebkitBackdropFilter: blur ? `blur(${blur}px) saturate(1.3)` : undefined,
          border,
          boxShadow: shadow,
          ...style,
        }}
      >
        <div className={`flex flex-col h-auto ${contentClassName}`}>
          {children}
        </div>
      </div>
    );
  }

  /* ── Elevated variant: full GlassSurface with SVG displacement ── */
  return (
    <GlassSurface
      width="100%"
      height="auto"
      borderRadius={borderRadius}
      backgroundOpacity={0.16}
      blur={18}
      saturation={1.4}
      distortionScale={-160}
      displace={0}
      className={[
        "border border-white/10",
        "transition-all duration-200",
        hoverBase,
        "shadow-[0_0_40px_rgba(var(--color-primary-rgb,249,115,22),0.18),0_8px_32px_rgba(0,0,0,0.12)]",
        "border-[rgba(var(--color-primary-rgb,249,115,22),0.20)]",
        className,
      ].filter(Boolean).join(" ")}
      contentClassName={`flex flex-col !h-auto ${contentClassName}`}
      style={style}
    >
      {children}
    </GlassSurface>
  );
}

export default GlassCard;
