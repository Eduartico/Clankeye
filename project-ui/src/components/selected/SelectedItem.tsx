interface SelectedItemProps {
  item: any;
}

export default function SelectedItem({ item }: SelectedItemProps) {
  return (
    <div className="w-fit h-fit flex items-center bg-slate-400 bg-opacity-50 rounded-xl px-4 py-2 gap-x-4">
      <h1 className="text-lg font-bold text-slate-700 dark:text-white">
        {item.title}
      </h1>
      <button
        onClick={() => item.remove()}
        className=" flex items-center justify-center rounded-full p-1 font-bold text-slate-700 dark:text-white hover:text-red-600 dark:hover:text-slate-50 dark:hover:bg-slate-200 dark:hover:bg-opacity-50 transition ease-in-out duration-200"
      >
        {item.icon}
      </button>
    </div>
  );
}
