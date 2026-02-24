import { useState } from "react";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsIcon from "@mui/icons-material/Settings";
import { useTheme } from "../../contexts/ThemeContextType";
import { ThemeSettings } from "../theme";

interface ToggleDarkThemeProps {
  showSettings?: boolean;
}

export default function ToggleDarkTheme({ showSettings = false }: ToggleDarkThemeProps) {
  const { isDarkMode, toggleMode } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="relative flex items-center gap-2">
      {/* Quick toggle button */}
      <button
        onClick={toggleMode}
        className="glass-btn glass-btn-ghost flex items-center justify-center p-2 rounded-full"
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </button>

      {/* Optional settings button */}
      {showSettings && (
        <>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="glass-btn glass-btn-ghost flex items-center justify-center p-2 rounded-full"
            aria-label="Theme settings"
          >
            <SettingsIcon />
          </button>

          {/* Settings dropdown */}
          {settingsOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setSettingsOpen(false)}
              />
              {/* Settings panel */}
              <div className="absolute right-0 top-12 z-50 w-80">
                <ThemeSettings onClose={() => setSettingsOpen(false)} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
