/**
 * GlassButton — Button built on GlassSurface.
 *
 * Variants: glass | ghost | outline | solid
 * Sizes:    sm | md | lg | icon
 *
 * For the `solid` variant, a gradient overlay renders inside GlassSurface
 * so GlassSurface's background stays transparent (Aurora shows through).
 */
import React from "react";
import { Slot } from "@radix-ui/react-slot";
import GlassSurface from "../ui/GlassSurface";
import { cn } from "../../lib/utils";

export type GlassButtonVariant = "glass" | "ghost" | "outline" | "solid";
export type GlassButtonSize    = "sm" | "md" | "lg" | "icon";

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  asChild?: boolean;
}

const SIZE_STYLES: Record<
  GlassButtonSize,
  { h: number; px: string; text: string; radius: number }
> = {
  sm:   { h: 32, px: "px-3", text: "text-xs",  radius: 10  },
  md:   { h: 40, px: "px-4", text: "text-sm",  radius: 12  },
  lg:   { h: 48, px: "px-6", text: "text-base", radius: 14 },
  icon: { h: 40, px: "px-0", text: "text-sm",  radius: 999 },
};

const VARIANT_OPACITY: Record<GlassButtonVariant, number> = {
  glass:   0.10,
  ghost:   0.04,
  outline: 0.04,
  solid:   0.00, // gradient overlay handles fill
};

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "glass",
      size = "md",
      asChild = false,
      className,
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const { h, px, text, radius } = SIZE_STYLES[size];
    const Comp = asChild ? Slot : "button";

    const borderStyle: React.CSSProperties =
      variant === "outline"
        ? { border: "1px solid rgba(var(--color-primary-rgb,249,115,22), 0.55)" }
        : { border: "1px solid rgba(255,255,255,0.14)" };

    return (
      <Comp
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex cursor-pointer border-0 bg-transparent p-0 outline-none",
          "focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-primary)/0.65)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "group",
          className
        )}
        style={{ height: h, ...style }}
        {...props}
      >
        <GlassSurface
          width="100%"
          height={h}
          borderRadius={radius}
          backgroundOpacity={VARIANT_OPACITY[variant]}
          blur={variant === "ghost" ? 8 : 12}
          saturation={1.2}
          distortionScale={-120}
          displace={0}
          className={cn(
            "transition-all duration-200",
            "group-hover:-translate-y-px",
            "group-hover:shadow-[0_0_24px_rgba(var(--color-primary-rgb,249,115,22),0.22)]",
            "group-active:scale-[0.98]"
          )}
          contentClassName="relative flex items-center justify-center"
          style={borderStyle}
        >
          {/* Solid gradient overlay (only for solid variant) */}
          {variant === "solid" && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--color-primary-dark)), hsl(var(--color-primary-light)))",
                borderRadius: `${radius}px`,
              }}
            />
          )}

          {/* Label */}
          <span
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 font-semibold",
              text,
              size === "icon" ? "w-full h-full" : px,
              variant === "solid" ? "text-white" : ""
            )}
          >
            {children}
          </span>
        </GlassSurface>
      </Comp>
    );
  }
);

GlassButton.displayName = "GlassButton";
export default GlassButton;

