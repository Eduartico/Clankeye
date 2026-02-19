import { defaultTheme } from './presets/default';
import { oceanTheme } from './presets/ocean';
import { sunsetTheme } from './presets/sunset';
import { forestTheme } from './presets/forest';
import { midnightTheme } from './presets/midnight';
import type { Theme, ThemeColors, ThemeConfig, ThemeContextValue, ColorScale } from './types';

// Export all themes
export const themes: Theme[] = [
  defaultTheme,
  oceanTheme,
  sunsetTheme,
  forestTheme,
  midnightTheme,
];

// Export individual themes
export { defaultTheme, oceanTheme, sunsetTheme, forestTheme, midnightTheme };

// Export types
export type { Theme, ThemeColors, ThemeConfig, ThemeContextValue, ColorScale };

// Helper to find a theme by id
export function getThemeById(id: string): Theme | undefined {
  return themes.find(t => t.id === id);
}

// Default export
export default themes;
