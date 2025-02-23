interface GridCardsProps {
  children: React.ReactNode;
}

export default function GridCards({ children } : GridCardsProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,100px))] sm:grid-cols-[repeat(auto-fill,minmax(400px,100px))] justify-center gap-10">
      {children}
    </div>
  );
}
