/**
 * GlassCard — Interactive card surface built on GlassSurface.
 *
 * Height is always auto (grows with content).
 * Use for: item cards, feature tiles, info panels.
 *
 * Variants:
 *   surface  — default, subtle frost, hover glow
 *   elevated — permanent primary glow + shadow
 *   flat     — minimal, no blur (for nesting)
 */
import React from "react";
import GlassSurface from "../ui/GlassSurface";

export type GlassCardVariant = "surface" | "elevated" | "flat";

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  borderRadius?: number;
  /** Extra class applied to the GlassSurface container */
  className?: string;
  /** Extra class applied to the content wrapper inside GlassSurface */
  contentClassName?: string;
  style?: React.CSSProperties;
}

const VARIANT_CONFIG: Record<
  GlassCardVariant,
  { backgroundOpacity: number; blur: number; saturation: number; distortionScale: number }
> = {
  surface:  { backgroundOpacity: 0.12, blur: 16, saturation: 1.3, distortionScale: -140 },
  elevated: { backgroundOpacity: 0.16, blur: 18, saturation: 1.4, distortionScale: -160 },
  flat:     { backgroundOpacity: 0.06, blur: 0,  saturation: 1.1, distortionScale: -80  },
};

export function GlassCard({
  children,
  variant = "surface",
  borderRadius = 24,
  className = "",
  contentClassName = "",
  style,
}: GlassCardProps) {
  const cfg = VARIANT_CONFIG[variant];

  const hoverClasses =
    variant === "flat"
      ? ""
      : [
          "hover:border-[rgba(var(--color-primary-rgb,249,115,22),0.25)]",
          "hover:-translate-y-0.5",
          "hover:shadow-[0_8px_32px_rgba(var(--color-primary-rgb,249,115,22),0.14),0_12px_40px_rgba(0,0,0,0.15)]",
        ].join(" ");

  const elevatedClasses =
    variant === "elevated"
      ? [
          "shadow-[0_0_40px_rgba(var(--color-primary-rgb,249,115,22),0.18),0_8px_32px_rgba(0,0,0,0.12)]",
          "border-[rgba(var(--color-primary-rgb,249,115,22),0.20)]",
        ].join(" ")
      : "";

  return (
    <GlassSurface
      width="100%"
      height="auto"
      borderRadius={borderRadius}
      backgroundOpacity={cfg.backgroundOpacity}
      blur={cfg.blur}
      saturation={cfg.saturation}
      distortionScale={cfg.distortionScale}
      displace={0}
      className={[
        "border border-white/10",
        "transition-all duration-200",
        hoverClasses,
        elevatedClasses,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      contentClassName={`flex flex-col !h-auto ${contentClassName}`}
      style={style}
    >
      {children}
    </GlassSurface>
  );
}

export default GlassCard;
