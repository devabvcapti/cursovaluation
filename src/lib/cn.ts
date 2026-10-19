import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names (clsx) and resolves conflicting
 * Tailwind utility classes in favor of the last one (tailwind-merge).
 * Use this everywhere a component accepts a `className` prop so callers
 * can override default styling without fighting class order.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}
