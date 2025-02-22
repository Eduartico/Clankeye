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
      className="p-2 rounded-full   bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-gray-500 text-gray-500 hover:text-gray-700 transition ease-in-out duration-200"
    >
      {theme.isDarkMode ? (
        <LightModeIcon className="w-6 h-6" />
      ) : (
        <DarkModeIcon className="w-6 h-6" />
      )}
    </button>
  );
}
