/**
 * Color manipulation utilities
 */

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Lighten a color by a percentage
 */
export function lighten(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  return rgbToHex(
    rgb.r + (255 - rgb.r) * factor,
    rgb.g + (255 - rgb.g) * factor,
    rgb.b + (255 - rgb.b) * factor
  );
}

/**
 * Darken a color by a percentage
 */
export function darken(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  return rgbToHex(
    rgb.r * factor,
    rgb.g * factor,
    rgb.b * factor
  );
}

/**
 * Get contrast color (black or white) for a given background
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Generate a color scale from a base color
 */
export function generateColorScale(baseColor: string): Record<string, string> {
  return {
    '50': lighten(baseColor, 95),
    '100': lighten(baseColor, 85),
    '200': lighten(baseColor, 70),
    '300': lighten(baseColor, 50),
    '400': lighten(baseColor, 25),
    '500': baseColor,
    '600': darken(baseColor, 10),
    '700': darken(baseColor, 25),
    '800': darken(baseColor, 40),
    '900': darken(baseColor, 55),
    '950': darken(baseColor, 70),
  };
}

/**
 * Check if a string is a valid hex color
 */
export function isValidHex(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Convert hex to HSL
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
}

/**
 * Derive primary color variants using HSL adjustments.
 * Returns the base, a lighter (+12% lightness), and a darker (-12% lightness) variant.
 */
export function derivePrimaryVariants(baseHex: string): {
  primary: string;
  primaryLight: string;
  primaryDark: string;
} {
  const hsl = hexToHsl(baseHex);
  if (!hsl) return { primary: baseHex, primaryLight: baseHex, primaryDark: baseHex };
  return {
    primary: baseHex,
    primaryLight: hslToHex(hsl.h, Math.min(100, hsl.s + 5), Math.min(100, hsl.l + 12)),
    primaryDark: hslToHex(hsl.h, Math.min(100, hsl.s + 5), Math.max(0, hsl.l - 12)),
  };
}

/**
 * Convert a hex color to an RGB string (e.g. "255, 147, 52")
 */
export function hexToRgbString(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '0, 0, 0';
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

export default {
  hexToRgb,
  rgbToHex,
  lighten,
  darken,
  getContrastColor,
  generateColorScale,
  isValidHex,
  hexToHsl,
  hslToHex,
  derivePrimaryVariants,
  hexToRgbString,
};
