interface GridCardsProps {
  children: React.ReactNode;
}

export default function GridCards({ children } : GridCardsProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,100px))] justify-center gap-10 px-14">
      {children}
    </div>
  );
}
