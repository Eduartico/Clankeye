import * as React from "react";
import { cn } from "../../lib/utils";

/* ═══════════════════════════════════════════════════════════════════════
   GlassInput — Layer 2 glass-styled input
   ═══════════════════════════════════════════════════════════════════════
   Extends the shadcn/ui Input with translucent glass styling.
   Focus ring uses primary accent colour only.
   ═══════════════════════════════════════════════════════════════════════ */

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl px-3 py-2 text-sm",
          "outline-none transition-all duration-200",
          /* glass surface */
          "backdrop-blur-[12px] backdrop-saturate-[120%]",
          "bg-white/50 dark:bg-white/[0.06]",
          "border-[1.5px] border-black/[0.08] dark:border-white/[0.1]",
          "text-text-primary",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
          /* focus — primary accent ring */
          "focus:border-primary",
          "focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_0_3px_rgba(var(--color-primary-rgb,249,115,22),0.15)]",
          /* placeholder */
          "placeholder:text-text-disabled",
          /* disabled */
          "disabled:cursor-not-allowed disabled:opacity-50",
          /* file input */
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
GlassInput.displayName = "GlassInput";

export { GlassInput };
export default GlassInput;
