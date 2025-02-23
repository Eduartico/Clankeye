import React from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import NoImage from "../../assets/no-image.png";
interface CardItemProps {
  item: any;
}
export default function CardItem({ item }: CardItemProps) {

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 0 || event.button === 1) {
      // Left-click (0) or Middle-click (1)
      const newTab = window.open(item.url, "_blank");
      if (newTab) {
        newTab.opener = null; // Prevents potential security vulnerabilities
      }
    }
  };

  return (
    <div className="w-[300px] sm:w-[400px] min-h-[450px] bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-[#393939] rounded-3xl p-5 group cursor-pointer hover:shadow-lg hover:shadow-thunderbird-500 hover:scale-[1.02] transition ease-in-out duration-150" onMouseDown={handleClick}>
      <div className="w-full h-full flex flex-col gap-4">
        <img
          src={item.imgLink || NoImage}
          alt={item.title}
          className="w-full h-[200px] object-cover rounded-2xl"
        />

        <div className="h-full flex flex-col justify-between gap-2">
          <h5 className="text-2xl font-bold text-wrap break-all min-h-24 h-24 overflow-y-auto tracking-tight text-slate-900 dark:text-white">
            {item.title}
          </h5>

          <h5 className="h-full flex items-center justify-between text-3xl font-bold text-wrap break-all overflow-y-auto tracking-tight text-slate-900 dark:text-thunderbird-500">
            &#8364; {item.price}
            <div className="text-thunderbird-500 transition ease-in-out duration-150">
              <OpenInNewIcon sx={{ fontSize: 30 }} />
            </div>
          </h5>
        </div>
      </div>
    </div>
  );
}
