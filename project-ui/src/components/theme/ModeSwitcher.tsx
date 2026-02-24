import React from 'react';
import { useTheme } from '../../contexts/ThemeContextType';

interface ModeSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Mode switcher component for light/dark/system modes
 */
export function ModeSwitcher({ className = '', showLabel = true }: ModeSwitcherProps) {
  const { mode, config, setMode } = useTheme();

  const modes = [
    { value: 'light' as const, label: 'Light', icon: '☀️' },
    { value: 'dark' as const, label: 'Dark', icon: '🌙' },
    { value: 'system' as const, label: 'System', icon: '💻' },
  ];

  return (
    <div className={`mode-switcher ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Mode
        </label>
      )}
      <div className="flex rounded-2xl overflow-hidden glass-surface-light">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`
              flex-1 py-2 px-3 text-sm font-medium transition-all
              flex items-center justify-center gap-1
              ${config.mode === m.value
                ? 'glass-btn-primary rounded-xl !border-transparent'
                : 'text-text-secondary hover:text-text-primary'
              }
            `}
            title={m.value === 'system' ? `Current: ${mode}` : undefined}
          >
            <span>{m.icon}</span>
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ModeSwitcher;
