/**
 * GlassPanel — Layout-level glass surface.
 *
 * Use for: sidebar, settings panels, hero sections, any full-size container
 * that needs a glass background but must support flex / scroll children.
 *
 * Architecture: renders a `position: relative` wrapper.
 * GlassSurface is positioned absolute inset-0 as the visual background.
 * Children are rendered in a z-10 layer above it.
 *
 * This pattern avoids height:100% issues on auto-sized containers.
 */
import React from "react";
import GlassSurface, { GlassSurfaceProps } from "../ui/GlassSurface";

// ─── Intensity presets ────────────────────────────────────────────────────────

const INTENSITY: Record<
  "subtle" | "medium" | "high",
  { backgroundOpacity: number; blur: number; saturation: number; distortionScale: number }
> = {
  subtle: { backgroundOpacity: 0.12, blur: 14, saturation: 1.2, distortionScale: -100 },
  medium: { backgroundOpacity: 0.18, blur: 16, saturation: 1.3, distortionScale: -120 },
  high:   { backgroundOpacity: 0.25, blur: 24, saturation: 1.5, distortionScale: -150 },
};

// ─── GlassPanel ───────────────────────────────────────────────────────────────

export interface GlassPanelProps {
  children: React.ReactNode;
  /** Outer wrapper className (positioning, sizing) */
  className?: string;
  /** Children wrapper className (layout inside the panel) */
  contentClassName?: string;
  intensity?: "subtle" | "medium" | "high";
  /** Show primary-color accent border */
  accentBorder?: boolean;
  /** Extra props forwarded to GlassSurface */
  glassProps?: Partial<GlassSurfaceProps>;
  style?: React.CSSProperties;
}

export function GlassPanel({
  children,
  className = "",
  contentClassName = "",
  intensity = "medium",
  accentBorder = false,
  glassProps = {},
  style,
}: GlassPanelProps) {
  const preset = INTENSITY[intensity];

  const borderStyle: React.CSSProperties = accentBorder
    ? { border: "1px solid rgba(var(--color-primary-rgb, 249,115,22), 0.18)" }
    : {};

  return (
    <div className={`relative ${className}`} style={style}>
      {/* ── Layer 0: Glass background ── */}
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={0}
        backgroundOpacity={preset.backgroundOpacity}
        blur={preset.blur}
        saturation={preset.saturation}
        distortionScale={preset.distortionScale}
        displace={0}
        className="!absolute !inset-0 !rounded-none"
        style={{
          ...borderStyle,
          boxShadow: accentBorder
            ? `0 0 40px rgba(var(--color-primary-rgb, 249,115,22), 0.10)`
            : undefined,
        }}
        {...glassProps}
      />
      {/* ── Layer 1: Content ── */}
      <div className={`relative z-10 w-full h-full ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}

export default GlassPanel;
