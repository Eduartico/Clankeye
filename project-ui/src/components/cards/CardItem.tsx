import React from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import NoImage from "../../assets/no-image.png";
interface CardItemProps {
  item: any;
}
export default function CardItem({ item }: CardItemProps) {
  return (
    <div className="w-[400px] min-h-[450px] bg-white dark:bg-gray-800 border scroll border-gray-200 rounded-3xl shadow dark:border-none overflow-auto p-5 group cursor-pointer hover:shadow-lg hover:shadow-purple-300 hover:scale-[1.02] transition ease-in-out duration-150  ">
      <div className="w-full h-full flex flex-col  gap-4">
        <img
          src={item.imgLink || NoImage}
          alt={item.title}
          className="w-full h-[200px] object-cover rounded-t-2xl"
        />

        <div className="h-full flex flex-col justify-between gap-2">
          <h5 className="text-2xl font-bold text-wrap break-all min-h-24 h-24 overflow-y-auto tracking-tight text-gray-900 dark:text-white">
            {item.title}
          </h5>

          <h5 className="h-full   flex items-center justify-between text-2xl font-bold text-wrap break-all   overflow-y-auto tracking-tight   text-gray-700 dark:text-gray-400">
            &#8364; {item.price}
            <div className="group-hover:text-lochmara-600 transition ease-in-out duration-100">
              <OpenInNewIcon sx={{ fontSize: 30 }} />
            </div>
          </h5>
        </div>
      </div>
    </div>
  );
}
