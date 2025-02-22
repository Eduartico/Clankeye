interface HeaderProps {
  children: React.ReactNode;
}

export default function Header({ children } : HeaderProps) {
  return (
    <div className="w-full flex flex-wrap items-center justify-around mx-auto p-4 gap-4">
      {children}
    </div>
  );
}
