/**
 * Theme type definitions for Clankeye
 */

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ThemeColors {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  
  success: Partial<ColorScale>;
  warning: Partial<ColorScale>;
  error: Partial<ColorScale>;
  info: Partial<ColorScale>;
  
  background: {
    default: string;
    paper: string;
    elevated: string;
  };
  
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  
  border: {
    default: string;
    light: string;
    focus: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  mode: 'light' | 'dark';
  colors: {
    light: Partial<ThemeColors>;
    dark: Partial<ThemeColors>;
  };
}

export interface ThemeConfig {
  activeTheme: string;
  mode: 'light' | 'dark' | 'system';
  customColors?: Partial<ThemeColors>;
}

export interface ThemeContextValue {
  theme: Theme;
  mode: 'light' | 'dark';
  config: ThemeConfig;
  
  setTheme: (themeId: string) => void;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleMode: () => void;
  setCustomColors: (colors: Partial<ThemeColors>) => void;
  resetToDefault: () => void;
  
  availableThemes: Theme[];
  currentColors: Partial<ThemeColors>;
}
