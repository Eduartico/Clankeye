/**
 * GlassSurface — React Bits component (manual install, source: github.com/DavidHDev/react-bits)
 *
 * Customised for Clankeye:
 *   • Dark mode reads html.dark class (ThemeContext) via MutationObserver
 *     instead of prefers-color-scheme media query
 *   • Default width/height = "100%" (flex-friendly)
 *   • contentClassName prop for layout overrides
 *   • Content div has no default centering (children manage their own layout)
 */
import React, { useCallback, useEffect, useId, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GlassBlendMode =
  | "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten"
  | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference"
  | "exclusion" | "hue" | "saturation" | "color" | "luminosity"
  | "plus-darker" | "plus-lighter";

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  /** CSS width — number = px, string = CSS value. Default "100%" */
  width?: number | string;
  /** CSS height — number = px, string = CSS value. Default "100%" */
  height?: number | string;
  borderRadius?: number;
  /** Edge gradient width factor for displacement map */
  borderWidth?: number;
  /** Brightness % of the inner glow rect in the displacement map */
  brightness?: number;
  /** Opacity of the glow rect */
  opacity?: number;
  /** Input blur (px) applied to the displacement map */
  blur?: number;
  /** Output blur stdDeviation on the composited RGB channels */
  displace?: number;
  /** Frost / background tint opacity 0–1 */
  backgroundOpacity?: number;
  /** Saturation multiplier for the SVG backdrop-filter */
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: "R" | "G" | "B";
  yChannel?: "R" | "G" | "B";
  mixBlendMode?: GlassBlendMode;
  className?: string;
  /** Classes applied to the inner content wrapper (overrides layout defaults) */
  contentClassName?: string;
  style?: React.CSSProperties;
}

// ─── Dark mode hook — tracks html.dark class (not system pref) ───────────────

function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// ─── Component ────────────────────────────────────────────────────────────────

const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = "100%",
  height = "100%",
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = "R",
  yChannel = "G",
  mixBlendMode = "difference",
  className = "",
  contentClassName = "",
  style = {},
}) => {
  const uniqueId = useId().replace(/:/g, "-");
  const filterId    = `glass-filter-${uniqueId}`;
  const redGradId   = `red-grad-${uniqueId}`;
  const blueGradId  = `blue-grad-${uniqueId}`;

  const [svgSupported, setSvgSupported] = useState(false);
  const containerRef    = useRef<HTMLDivElement>(null);
  const feImageRef      = useRef<SVGFEImageElement>(null);
  const redChannelRef   = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef  = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  const isDarkMode = useDarkMode();

  // ── Generate SVG displacement map as a data URI ──────────────────────────
  const generateDisplacementMap = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width  || 400;
    const h = rect?.height || 200;
    const edgeSize = Math.min(w, h) * (borderWidth * 0.5);

    const svg = `
      <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}"  x1="100%" y1="0%"   x2="0%"   y2="0%">
            <stop offset="0%"   stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%"   y1="0%"   x2="0%"   y2="100%">
            <stop offset="0%"   stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="black"/>
        <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${redGradId})"/>
        <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode:${mixBlendMode}"/>
        <rect x="${edgeSize}" y="${edgeSize}" width="${w - edgeSize * 2}" height="${h - edgeSize * 2}" rx="${borderRadius}"
              fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)"/>
      </svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [borderRadius, borderWidth, brightness, blur, opacity, mixBlendMode, redGradId, blueGradId]);

  // ── Push displacement map and channel offsets to SVG filter ──────────────
  const updateDisplacementMap = useCallback(() => {
    feImageRef.current?.setAttribute("href", generateDisplacementMap());
    (
      [
        { ref: redChannelRef,   offset: redOffset },
        { ref: greenChannelRef, offset: greenOffset },
        { ref: blueChannelRef,  offset: blueOffset },
      ] as const
    ).forEach(({ ref, offset }) => {
      if (!ref.current) return;
      ref.current.setAttribute("scale", String(distortionScale + offset));
      ref.current.setAttribute("xChannelSelector", xChannel);
      ref.current.setAttribute("yChannelSelector", yChannel);
    });
    gaussianBlurRef.current?.setAttribute("stdDeviation", String(displace));
  }, [
    generateDisplacementMap,
    redOffset, greenOffset, blueOffset,
    distortionScale, xChannel, yChannel, displace,
  ]);

  useEffect(() => { updateDisplacementMap(); }, [updateDisplacementMap]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => setTimeout(updateDisplacementMap, 0));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateDisplacementMap]);

  // ── Detect SVG backdrop-filter support (Chromium only) ───────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isWebkit  = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    if (isWebkit || isFirefox) { setSvgSupported(false); return; }
    const div = document.createElement("div");
    div.style.backdropFilter = `url(#${filterId})`;
    setSvgSupported(div.style.backdropFilter !== "");
  }, [filterId]);

  // ── Compute container inline styles ──────────────────────────────────────
  const getContainerStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      ...style,
      width:  typeof width  === "number" ? `${width}px`  : width,
      height: typeof height === "number" ? `${height}px` : height,
      borderRadius: `${borderRadius}px`,
    };

    const bdSupported =
      typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "blur(10px)");

    // Best path: SVG displacement filter (Chromium)
    if (svgSupported) {
      return {
        ...base,
        background: isDarkMode
          ? `hsl(0 0% 0% / ${backgroundOpacity})`
          : `hsl(0 0% 100% / ${backgroundOpacity})`,
        backdropFilter: `url(#${filterId}) saturate(${saturation})`,
        boxShadow: isDarkMode
          ? `0 0 1px 0 rgba(255,255,255,0.06) inset,
             0px 4px 16px rgba(17,17,26,0.06), 0px 8px 24px rgba(17,17,26,0.06)`
          : `0 0 1px 0 rgba(255,255,255,0.4) inset,
             0px 4px 16px rgba(17,17,26,0.04), 0px 8px 24px rgba(17,17,26,0.04)`,
      };
    }

    // Fallback: regular backdrop-filter (Safari, Firefox)
    if (bdSupported) {
      return isDarkMode
        ? {
            ...base,
            background: `rgba(10, 15, 30, ${Math.min(backgroundOpacity * 2 + 0.04, 0.55)})`,
            backdropFilter:        `blur(${blur}px) saturate(${1 + saturation * 0.6})`,
            WebkitBackdropFilter:  `blur(${blur}px) saturate(${1 + saturation * 0.6})`,
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.04)",
          }
        : {
            ...base,
            background: `rgba(255, 255, 255, ${Math.min(backgroundOpacity * 2 + 0.06, 0.50)})`,
            backdropFilter:        `blur(${blur}px) saturate(${1 + saturation * 0.6})`,
            WebkitBackdropFilter:  `blur(${blur}px) saturate(${1 + saturation * 0.6})`,
            border: "1px solid rgba(255,255,255,0.30)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.04)",
          };
    }

    // Last resort: semi-opaque solid
    return {
      ...base,
      background: isDarkMode ? "rgba(14, 20, 38, 0.75)" : "rgba(255, 255, 255, 0.55)",
      border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.25)",
    };
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden transition-all duration-300 ease-out ${className}`}
      style={getContainerStyles()}
    >
      {/* SVG displacement filter — hidden, used only for CSS filter reference */}
      <svg
        className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="0%" y="0%" width="100%" height="100%"
          >
            <feImage
              ref={feImageRef}
              x="0" y="0" width="100%" height="100%"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap ref={redChannelRef}   in="SourceGraphic" in2="map" result="dispRed" />
            <feColorMatrix in="dispRed"   type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
            <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" result="dispGreen" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
            <feDisplacementMap ref={blueChannelRef}  in="SourceGraphic" in2="map" result="dispBlue" />
            <feColorMatrix in="dispBlue"  type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
            <feBlend in="red"  in2="green" mode="screen" result="rg" />
            <feBlend in="rg"   in2="blue"  mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      {/* Content */}
      <div className={`w-full h-full relative z-10 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
