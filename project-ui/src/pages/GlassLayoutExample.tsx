import React from "react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardContent,
  GlassCardTitle,
  GlassCardDescription,
} from "../components/glass/GlassCard";
import { GlassButton } from "../components/glass/GlassButton";
import { GlassInput } from "../components/glass/GlassInput";
import {
  GlassDialog,
  GlassDialogTrigger,
  GlassDialogContent,
  GlassDialogHeader,
  GlassDialogTitle,
  GlassDialogDescription,
  GlassDialogFooter,
} from "../components/glass/GlassDialog";
import { GlassContainer } from "../components/glass/GlassContainer";

/* ═══════════════════════════════════════════════════════════════════════
   GlassLayoutExample
   ═══════════════════════════════════════════════════════════════════════
   Demonstrates the three-layer architecture:
     Layer 0 — Aurora (rendered by Layout, always visible behind)
     Layer 1 — Mostly-solid sections (sidebar, main panel)
     Layer 2 — Interactive glass elements (cards, buttons, inputs, modals)

   ✓ Aurora clearly visible through translucent areas
   ✓ Some areas translucent, some mostly solid
   ✓ Primary colour is accent only (rings, glows, borders)
   ═══════════════════════════════════════════════════════════════════════ */

export default function GlassLayoutExample() {
  return (
    <div className="flex w-full h-full gap-4 p-4">
      {/* ─── Layer 1: Sidebar — mostly solid ──────────────────────── */}
      <GlassContainer
        className="w-64 shrink-0 rounded-2xl p-4 flex flex-col gap-3"
        blur={20}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Sidebar
        </h2>
        <p className="text-sm text-text-secondary">
          This is a <strong>Layer 1</strong> container — mostly solid surface
          with subtle translucency (opacity 0.04–0.12 in dark).
        </p>

        <GlassInput placeholder="Search..." className="mt-2" />

        <nav className="flex flex-col gap-1 mt-4">
          {["Dashboard", "Items", "Settings"].map((label) => (
            <GlassButton key={label} variant="ghost" size="sm" className="justify-start">
              {label}
            </GlassButton>
          ))}
        </nav>
      </GlassContainer>

      {/* ─── Layer 1 + 2: Main content ────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        {/* Header bar — mostly solid */}
        <GlassContainer className="p-4 rounded-2xl" blur={16}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-text-primary">
              Glass Layout Example
            </h1>
            <div className="flex gap-2">
              <GlassButton variant="outline" size="sm">
                Cancel
              </GlassButton>
              <GlassButton variant="solid" size="sm">
                Save
              </GlassButton>
            </div>
          </div>
        </GlassContainer>

        {/* Card grid — Layer 2 interactive glass */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Surface card — default */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Surface Card</GlassCardTitle>
              <GlassCardDescription>
                Default variant — translucent with blur.
                Primary accent appears on hover glow only.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-sm text-text-secondary">
                Aurora is visible through this card.
              </p>
            </GlassCardContent>
          </GlassCard>

          {/* Elevated card — more glow */}
          <GlassCard variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle>Elevated Card</GlassCardTitle>
              <GlassCardDescription>
                Highlight area with primary outer glow.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-sm text-text-secondary">
                Uses <code>box-shadow</code> with{" "}
                <code>--color-primary-rgb</code> for the glow.
              </p>
            </GlassCardContent>
          </GlassCard>

          {/* Flat card — no blur */}
          <GlassCard variant="flat">
            <GlassCardHeader>
              <GlassCardTitle>Flat Card</GlassCardTitle>
              <GlassCardDescription>
                No backdrop-blur — use inside other glass for perf.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-sm text-text-secondary">
                Solid-ish surface, barely transparent.
              </p>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Button showcase */}
        <GlassContainer className="p-4 rounded-2xl" blur={16}>
          <h2 className="text-lg font-semibold mb-3 text-text-primary">
            Button Variants
          </h2>
          <div className="flex flex-wrap gap-3">
            <GlassButton variant="glass">Glass (default)</GlassButton>
            <GlassButton variant="ghost">Ghost</GlassButton>
            <GlassButton variant="outline">Outline</GlassButton>
            <GlassButton variant="solid">Solid Accent</GlassButton>
            <GlassButton variant="glass" size="sm">
              Small
            </GlassButton>
            <GlassButton variant="glass" size="lg">
              Large
            </GlassButton>
          </div>
        </GlassContainer>

        {/* Dialog demo */}
        <GlassContainer className="p-4 rounded-2xl" blur={16}>
          <h2 className="text-lg font-semibold mb-3 text-text-primary">
            Glass Dialog
          </h2>
          <GlassDialog>
            <GlassDialogTrigger asChild>
              <GlassButton variant="outline">Open Dialog</GlassButton>
            </GlassDialogTrigger>
            <GlassDialogContent>
              <GlassDialogHeader>
                <GlassDialogTitle>Glass Modal</GlassDialogTitle>
                <GlassDialogDescription>
                  This modal uses backdrop-blur(30px) with higher opacity than
                  cards. The overlay is rgba(0,0,0,0.4) with blur-xl.
                </GlassDialogDescription>
              </GlassDialogHeader>
              <div className="py-4">
                <GlassInput placeholder="Enter something..." />
              </div>
              <GlassDialogFooter>
                <GlassButton variant="ghost" size="sm">
                  Cancel
                </GlassButton>
                <GlassButton variant="solid" size="sm">
                  Confirm
                </GlassButton>
              </GlassDialogFooter>
            </GlassDialogContent>
          </GlassDialog>
        </GlassContainer>
      </div>
    </div>
  );
}
