import { ThemeColors, ColorScale } from '../types';

/**
 * Generate CSS custom properties from theme colors
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
