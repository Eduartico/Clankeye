import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { 
  themes, 
  getThemeById, 
  defaultTheme,
  type Theme, 
  type ThemeColors, 
  type ThemeConfig,
  type ThemeContextValue 
} from "../themes";
import { generateCSSVariables, applyCSSVariables } from "../themes/utils/cssVariables";

// Storage keys
const STORAGE_THEME_KEY = "clankeye-theme";
const STORAGE_MODE_KEY = "clankeye-mode";
const STORAGE_CUSTOM_COLORS_KEY = "clankeye-custom-colors";

// Legacy interface for backward compatibility
interface LegacyThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Full interface combining legacy and new features
interface FullThemeContextType extends LegacyThemeContextType, ThemeContextValue {}

export const ThemeContext = createContext<FullThemeContextType | undefined>(undefined);

// Helper to detect system preference
function getSystemMode(): 'light' | 'dark' {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
}

// Helper to get initial mode
function getInitialMode(): 'light' | 'dark' | 'system' {
  const stored = localStorage.getItem(STORAGE_MODE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  // Legacy check
  const legacyTheme = localStorage.getItem("theme");
  if (legacyTheme === 'dark') return 'dark';
  if (legacyTheme === 'light') return 'light';
  return 'system';
}

// Helper to get initial theme
function getInitialTheme(): Theme {
  const storedId = localStorage.getItem(STORAGE_THEME_KEY);
  if (storedId) {
    const theme = getThemeById(storedId);
    if (theme) return theme;
  }
  return defaultTheme;
}

// Helper to get custom colors
function getStoredCustomColors(): Partial<ThemeColors> | undefined {
  const stored = localStorage.getItem(STORAGE_CUSTOM_COLORS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [modeConfig, setModeConfig] = useState<'light' | 'dark' | 'system'>(getInitialMode);
  const [customColors, setCustomColorsState] = useState<Partial<ThemeColors> | undefined>(
    getStoredCustomColors
  );

  // Calculate actual mode based on config
  const mode: 'light' | 'dark' = useMemo(() => {
    if (modeConfig === 'system') {
      return getSystemMode();
    }
    return modeConfig;
  }, [modeConfig]);

  // Get current colors based on theme, mode, and custom colors
  const currentColors: Partial<ThemeColors> = useMemo(() => {
    const themeColors = theme.colors[mode];
    if (customColors) {
      // Deep merge custom colors with theme colors
      return { ...themeColors, ...customColors };
    }
    return themeColors;
  }, [theme, mode, customColors]);

  // Build config object
  const config: ThemeConfig = useMemo(() => ({
    activeTheme: theme.id,
    mode: modeConfig,
    customColors,
  }), [theme.id, modeConfig, customColors]);

  // Apply theme effects
  useEffect(() => {
    // Update dark class for Tailwind
    if (mode === 'dark') {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Apply CSS variables
    const cssVars = generateCSSVariables(currentColors, mode);
    applyCSSVariables(cssVars);

    // Store settings
    localStorage.setItem(STORAGE_MODE_KEY, modeConfig);
    localStorage.setItem(STORAGE_THEME_KEY, theme.id);
    // Legacy support
    localStorage.setItem("theme", mode);
  }, [theme, mode, modeConfig, currentColors]);

  // Store custom colors when they change
  useEffect(() => {
    if (customColors) {
      localStorage.setItem(STORAGE_CUSTOM_COLORS_KEY, JSON.stringify(customColors));
    } else {
      localStorage.removeItem(STORAGE_CUSTOM_COLORS_KEY);
    }
  }, [customColors]);

  // Listen for system theme changes
  useEffect(() => {
    if (modeConfig !== 'system') return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // Force re-render when system theme changes
      setModeConfig('system');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [modeConfig]);

  // Theme actions
  const setTheme = useCallback((themeId: string) => {
    const newTheme = getThemeById(themeId);
    if (newTheme) {
      setThemeState(newTheme);
    }
  }, []);

  const setMode = useCallback((newMode: 'light' | 'dark' | 'system') => {
    setModeConfig(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeConfig(prev => {
      if (prev === 'system') {
        return getSystemMode() === 'dark' ? 'light' : 'dark';
      }
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const setCustomColors = useCallback((colors: Partial<ThemeColors>) => {
    setCustomColorsState(colors);
  }, []);

  const resetToDefault = useCallback(() => {
    setThemeState(defaultTheme);
    setModeConfig('system');
    setCustomColorsState(undefined);
    localStorage.removeItem(STORAGE_CUSTOM_COLORS_KEY);
  }, []);

  // Legacy compatibility
  const toggleTheme = toggleMode;
  const isDarkMode = mode === 'dark';

  const contextValue: FullThemeContextType = useMemo(() => ({
    // Legacy API
    isDarkMode,
    toggleTheme,
    // New API
    theme,
    mode,
    config,
    setTheme,
    setMode,
    toggleMode,
    setCustomColors,
    resetToDefault,
    availableThemes: themes,
    currentColors,
  }), [
    isDarkMode,
    toggleTheme,
    theme,
    mode,
    config,
    setTheme,
    setMode,
    toggleMode,
    setCustomColors,
    resetToDefault,
    currentColors,
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook for using the theme context
export function useTheme(): FullThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
