import React from 'react';
import { useTheme } from '../../contexts/ThemeContextType';
import { Theme } from '../../themes/types';

interface ThemePickerProps {
  className?: string;
  showLabels?: boolean;
}

/**
 * Theme picker component for selecting between available themes
 */
export function ThemePicker({ className = '', showLabels = true }: ThemePickerProps) {
  const { theme, availableThemes, setTheme } = useTheme();

  return (
    <div className={`theme-picker ${className}`}>
      {showLabels && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Theme
        </label>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableThemes.map((t: Theme) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`
              p-3 rounded-2xl transition-all
              flex flex-col items-center gap-1
              hover:scale-105
              glass-surface-light
              ${theme.id === t.id 
                ? 'glow-primary !border-primary-500' 
                : 'hover:!border-primary-300 dark:hover:!border-primary-700'
              }
            `}
            title={t.description}
          >
            {/* Color preview dots */}
            <div className="flex gap-1">
              <span 
                className="w-4 h-4 rounded-full border border-border-light" 
                style={{ backgroundColor: t.colors.light.primary?.[500] }}
              />
              <span 
                className="w-4 h-4 rounded-full border border-border-light" 
                style={{ backgroundColor: t.colors.light.secondary?.[500] }}
              />
              <span 
                className="w-4 h-4 rounded-full border border-border-light" 
                style={{ backgroundColor: t.colors.light.accent?.[500] }}
              />
            </div>
            {showLabels && (
              <span className="text-xs text-text-primary font-medium">
                {t.name}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ThemePicker;
