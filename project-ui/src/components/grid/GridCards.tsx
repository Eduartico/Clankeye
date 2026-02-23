interface GridCardsProps {
  children: React.ReactNode;
  columns?: number;
}

export default function GridCards({ children, columns = 3 } : GridCardsProps) {
  // Responsive grid: on small screens force fewer columns
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: '1.25rem',
    justifyItems: 'center',
    width: '100%',
  };

  return (
    <div style={gridStyle} className="max-[640px]:!grid-cols-1 max-[900px]:!grid-cols-2">
      {children}
    </div>
  );
}
