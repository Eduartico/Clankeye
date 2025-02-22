import { Pagination } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../../contexts/ThemeContextType";

export default function PaginationHandler() {
  const theme = useContext(ThemeContext);
  if (!theme) return null;

  const main = {
    "& .MuiPaginationItem-root": {
      color: theme.isDarkMode ? "#fff" : "#000", // Set text color dynamically
    },
  };

  return (
    <div className=" fixed bottom-5 left-1/2 transform -translate-x-1/2 flex justify-center items-center py-2 bg-lochmara-200 dark:bg-lochmara-800 rounded-full">
      <Pagination count={10} siblingCount={1} boundaryCount={1} sx={main} />
    </div>
  );
}
