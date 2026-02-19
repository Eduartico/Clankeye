import React, { useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContextType';
import { ThemeColors, ColorScale } from '../../themes/types';
import { isValidHex, generateColorScale } from '../../themes/utils/colorUtils';

interface ColorCustomizerProps {
  className?: string;
}

type ColorKey = 'primary' | 'secondary' | 'accent';

/**
 * Color customizer component for adjusting theme colors
 */
export function ColorCustomizer({ className = '' }: ColorCustomizerProps) {
  const { currentColors, setCustomColors, resetToDefault } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handleColorChange = useCallback((colorKey: ColorKey, value: string) => {
    if (!isValidHex(value)) return;

    // Generate a full color scale from the base color
    const scale = generateColorScale(value);
    
    setCustomColors({
      ...currentColors,
      [colorKey]: scale as ColorScale,
    } as Partial<ThemeColors>);
  }, [currentColors, setCustomColors]);

  const getBaseColor = (colorKey: ColorKey): string => {
    const scale = currentColors[colorKey];
    return scale?.[500] || '#000000';
  };

  const colorInputs: { key: ColorKey; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
  ];

  return (
    <div className={`color-customizer ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-text-secondary mb-2"
      >
        <span>Customize Colors</span>
        <span className="text-lg">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="space-y-3 mt-3">
          {colorInputs.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="text-sm text-text-secondary w-20">
                {label}
              </label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={getBaseColor(key)}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border-default"
                />
                <input
                  type="text"
                  value={getBaseColor(key)}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm rounded border border-border-default 
                           bg-background-paper text-text-primary
                           focus:border-primary-500 focus:outline-none"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}

          <button
            onClick={resetToDefault}
            className="w-full mt-2 px-3 py-2 text-sm font-medium
                     text-text-secondary border border-border-default rounded-lg
                     hover:bg-background-elevated transition-colors"
          >
            Reset to Default
          </button>
        </div>
      )}
    </div>
  );
}

export default ColorCustomizer;
