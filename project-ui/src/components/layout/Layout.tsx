import { ThemeProvider, useTheme } from "../../contexts/ThemeContextType";
import Footer from "../footer/Footer";
import Navbar from "../navbar/Navbar";
import Aurora from "../aurora/Aurora";
import { useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   Layout — Glass / Liquid Surface Architecture
   ═══════════════════════════════════════════════════════════════════════
   Layer 0 — Aurora (fixed, inset-0, z-0)       → always visible
   Layer 1 — Base layout containers              → mostly solid, subtle translucency
   Layer 2 — Interactive glass elements          → cards, buttons, modals, inputs

   CRITICAL:
   • Root wrapper must NOT have a fully opaque background.
   • bg-transparent on the outermost div so Aurora shines through.
   • Content wrapper sits at z-10, above Aurora.
   ═══════════════════════════════════════════════════════════════════════ */

interface LayoutProps {
  children: React.ReactNode;
}

function mixHex(hexA: string, hexB: string, amount: number): string {
  const a = hexA.replace("#", "");
  const b = hexB.replace("#", "");
  const t = Math.max(0, Math.min(1, amount));

  const ar = parseInt(a.slice(0, 2), 16);
  const ag = parseInt(a.slice(2, 4), 16);
  const ab = parseInt(a.slice(4, 6), 16);

  const br = parseInt(b.slice(0, 2), 16);
  const bg = parseInt(b.slice(2, 4), 16);
  const bb = parseInt(b.slice(4, 6), 16);

  const r = Math.round(ar + (br - ar) * t)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(ag + (bg - ag) * t)
    .toString(16)
    .padStart(2, "0");
  const b2 = Math.round(ab + (bb - ab) * t)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b2}`;
}

function LayoutInner({ children }: LayoutProps) {
  const { primaryColor, primaryLight, primaryDark, isDarkMode } = useTheme();

  // Aurora colour stops, softly blended into the mode background
  const colorStops = useMemo((): [string, string, string] => {
    const modeBase = isDarkMode ? "#121b2d" : "#e7eef8";
    const mute = isDarkMode ? 0.34 : 0.28;

    return [
      mixHex(primaryDark, modeBase, mute),
      mixHex(primaryColor, modeBase, mute),
      mixHex(primaryLight, modeBase, mute),
    ];
  }, [primaryDark, primaryColor, primaryLight, isDarkMode]);

  return (
    <div className="relative h-screen flex flex-col font-noto bg-transparent text-text-primary">
      {/* ─── Layer 0: Aurora background ─────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Aurora
          colorStops={colorStops}
          blend={isDarkMode ? 0.58 : 0.5}
          amplitude={0.8}
          speed={0.4}
        />
      </div>

      {/* ─── Layer 1 + 2: Content (above Aurora) ────────────────────── */}
      <div className="relative z-10 h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex overflow-hidden">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider>
      <LayoutInner>{children}</LayoutInner>
    </ThemeProvider>
  );
}
