import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx — the shadcn/ui standard helper.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
