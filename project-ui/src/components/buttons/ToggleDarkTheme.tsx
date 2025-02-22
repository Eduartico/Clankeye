import { useContext, useEffect, useState } from "react";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { ThemeContext } from "../../contexts/ThemeContextType";

export default function ToggleDarkTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) return null;

  return (
    <button
      onClick={theme.toggleTheme}
      className="flex items-center justify-center p-2 rounded-full bg-zinc-200 dark:bg-zinc-800 dark:text-thunderbird-500 dark:hover:text-thunderbird-400 text-thunderbird-500 hover:text-thunderbird-700 transition ease-in-out duration-200"
    >
      {theme.isDarkMode ? (
        <LightModeIcon   />
      ) : (
        <DarkModeIcon   />
      )}
    </button>
  );
}
