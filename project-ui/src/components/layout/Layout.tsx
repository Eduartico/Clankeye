import { QueryProvider } from "../../contexts/QueryContextType";
import { ThemeProvider } from "../../contexts/ThemeContextType";
import Footer from "../footer/Footer";
import Navbar from "../navbar/Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col font-noto">
      <ThemeProvider>
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </ThemeProvider>
    </div>
  );
}
