/**
 * GlassDialog / GlassModal — High-emphasis glass modal built on Radix Dialog
 * and GlassSurface.
 *
 * Overlay:  semi-transparent black + backdrop-blur
 * Content:  GlassSurface with high backgroundOpacity + strong primary glow
 */
import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import GlassSurface from "../ui/GlassSurface";
import { cn } from "../../lib/utils";

// ─── Re-exports ───────────────────────────────────────────────────────────────

export const GlassDialog        = DialogPrimitive.Root;
export const GlassDialogTrigger = DialogPrimitive.Trigger;
export const GlassDialogClose   = DialogPrimitive.Close;

// ─── Overlay ──────────────────────────────────────────────────────────────────

const GlassDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/45 backdrop-blur-xl",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
GlassDialogOverlay.displayName = "GlassDialogOverlay";

// ─── Content ──────────────────────────────────────────────────────────────────

export const GlassDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    modalWidth?: string;
  }
>(({ className, children, modalWidth = "min(90vw, 560px)", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <GlassDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "duration-200",
        className
      )}
      style={{ width: modalWidth }}
      {...props}
    >
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={28}
        backgroundOpacity={0.22}
        blur={28}
        saturation={1.5}
        distortionScale={-150}
        displace={0.3}
        redOffset={0}
        greenOffset={8}
        blueOffset={16}
        mixBlendMode="screen"
        className="w-full"
        contentClassName="flex flex-col !h-auto p-6 gap-4"
        style={{
          border: "1px solid rgba(var(--color-primary-rgb, 249,115,22), 0.22)",
          boxShadow:
            "0 0 60px rgba(var(--color-primary-rgb, 249,115,22), 0.20), 0 24px 80px rgba(0,0,0,0.35)",
        }}
      >
        {children}

        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 top-4 z-20 rounded-full p-1.5",
            "opacity-70 hover:opacity-100 transition-opacity",
            "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary)/0.6)]"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </GlassSurface>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
GlassDialogContent.displayName = "GlassDialogContent";

// ─── Header / Footer helpers ──────────────────────────────────────────────────

export function GlassDialogHeader({
  className, ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)} {...props} />
  );
}

export function GlassDialogFooter({
  className, ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2", className)}
      {...props}
    />
  );
}

export function GlassDialogTitle({
  className, ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold glass-text", className)}
      {...props}
    />
  );
}

export function GlassDialogDescription({
  className, ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
