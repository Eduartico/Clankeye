import { ThemeColors, ColorScale } from '../types';
import { derivePrimaryVariants, hexToRgbString, hexToHsl } from './colorUtils';

/**
 * Convert a hex colour to an HSL triplet string usable by Tailwind's
 * hsl() alpha syntax:  "25 95% 53%"  (no commas, no parens).
 */
function hexToHslString(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return '0 0% 0%';
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
}

/**
 * Generate CSS custom properties from theme colors.
 * Emits both the legacy hex/rgb variables and the new shadcn-compatible
 * HSL triplet variables so Tailwind `hsl(var(--color-primary) / <alpha>)`
 * works.
 */
export function generateCSSVariables(
  colors: Partial<ThemeColors>,
  mode: 'light' | 'dark'
): Record<string, string> {
  const vars: Record<string, string> = {};

  // Process color scales
  const processColorScale = (name: string, scale: Partial<ColorScale> | undefined) => {
    if (!scale) return;
    
    Object.entries(scale).forEach(([key, value]) => {
      if (value) {
        vars[`--color-${name}-${key}`] = value;
      }
    });
  };

  // Primary, secondary, accent colors
  processColorScale('primary', colors.primary);
  processColorScale('secondary', colors.secondary);
  processColorScale('accent', colors.accent);

  // Semantic colors
  processColorScale('success', colors.success);
  processColorScale('warning', colors.warning);
  processColorScale('error', colors.error);
  processColorScale('info', colors.info);

  // Background colors
  if (colors.background) {
    vars['--color-background-default'] = colors.background.default || '';
    vars['--color-background-paper'] = colors.background.paper || '';
    vars['--color-background-elevated'] = colors.background.elevated || '';
  }

  // Text colors
  if (colors.text) {
    vars['--color-text-primary'] = colors.text.primary || '';
    vars['--color-text-secondary'] = colors.text.secondary || '';
    vars['--color-text-disabled'] = colors.text.disabled || '';
    vars['--color-text-inverse'] = colors.text.inverse || '';
  }

  // Border colors
  if (colors.border) {
    vars['--color-border-default'] = colors.border.default || '';
    vars['--color-border-light'] = colors.border.light || '';
    vars['--color-border-focus'] = colors.border.focus || '';
  }

  // Add mode indicator
  vars['--theme-mode'] = mode;

  // ── Derived primary color variants ──────────────────────────────────
  const basePrimary = colors.primary?.[500] || '#f97316';
  const { primary, primaryLight, primaryDark } = derivePrimaryVariants(basePrimary);

  // HSL triplet format for Tailwind / shadcn  (e.g. "25 95% 53%")
  vars['--color-primary'] = hexToHslString(primary);
  vars['--color-primary-light'] = hexToHslString(primaryLight);
  vars['--color-primary-dark'] = hexToHslString(primaryDark);

  // RGB comma format for rgba() usage in glass surfaces
  vars['--color-primary-rgb'] = hexToRgbString(primary);
  vars['--color-primary-light-rgb'] = hexToRgbString(primaryLight);
  vars['--color-primary-dark-rgb'] = hexToRgbString(primaryDark);

  // shadcn semantic token: --ring matches primary for focus rings
  vars['--ring'] = hexToHslString(primary);

  return vars;
}

/**
 * Apply CSS variables to document root
 */
export function applyCSSVariables(vars: Record<string, string>): void {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(key, value);
    }
  });
}

/**
 * Remove CSS variables from document root
 */
export function removeCSSVariables(varNames: string[]): void {
  const root = document.documentElement;
  varNames.forEach(name => {
    root.style.removeProperty(name);
  });
}

export default { generateCSSVariables, applyCSSVariables, removeCSSVariables };
