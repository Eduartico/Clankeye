/**
 * Glass component system — all built on GlassSurface (SVG displacement filter).
 *
 * Hierarchy:
 *   GlassSurface   →  src/components/ui/GlassSurface.tsx  (primitive)
 *   GlassPanel     →  layout containers (navbar, sidebar, footer, sections)
 *   GlassCard      →  interactive card tiles
 *   GlassButton    →  interactive buttons
 *   GlassDialog    →  modal dialogs (Radix Dialog + GlassSurface)
 *   GlassInput     →  text inputs (CSS backdrop-filter, no SVG needed at this scale)
 */

// ─── Core primitive (re-export for convenience) ───────────────────────────────
export { default as GlassSurface } from "../ui/GlassSurface";
export type { GlassSurfaceProps } from "../ui/GlassSurface";

// ─── Layout-level surfaces ────────────────────────────────────────────────────
export { GlassPanel } from "./GlassPanel";
export type { GlassPanelProps } from "./GlassPanel";

// ─── Card surface ─────────────────────────────────────────────────────────────
export { GlassCard, default as GlassCardDefault } from "./GlassCard";
export type { GlassCardProps, GlassCardVariant } from "./GlassCard";

// ─── Button ───────────────────────────────────────────────────────────────────
export { GlassButton } from "./GlassButton";
export type { GlassButtonProps, GlassButtonVariant, GlassButtonSize } from "./GlassButton";

// ─── Dialog / Modal ───────────────────────────────────────────────────────────
export {
  GlassDialog,
  GlassDialogTrigger,
  GlassDialogClose,
  GlassDialogContent,
  GlassDialogHeader,
  GlassDialogFooter,
  GlassDialogTitle,
  GlassDialogDescription,
} from "./GlassDialog";

// ─── Input ────────────────────────────────────────────────────────────────────
export { GlassInput } from "./GlassInput";

