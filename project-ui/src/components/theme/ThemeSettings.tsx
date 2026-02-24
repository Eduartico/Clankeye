import React from 'react';
import { ThemePicker } from './ThemePicker';
import { ModeSwitcher } from './ModeSwitcher';
import { ColorCustomizer } from './ColorCustomizer';

interface ThemeSettingsProps {
  className?: string;
  onClose?: () => void;
}

/**
 * Full theme settings panel combining all theme controls
 */
export function ThemeSettings({ className = '', onClose }: ThemeSettingsProps) {
  return (
    <div className={`theme-settings ${className}`}>
      <div className="glass-dropdown p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Appearance
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-6">
          <ModeSwitcher />
          <ThemePicker />
          <ColorCustomizer />
        </div>
      </div>
    </div>
  );
}

export default ThemeSettings;
