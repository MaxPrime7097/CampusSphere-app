import { cn } from "@/lib/utils";

interface SpheraIconProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "white" | "black" | "muted" | "blue" | "green" | "purple";
}

const SIZE_MAP = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  xl: "w-8 h-8",
};

const FILTER_MAP = {
  primary: "brightness(0) saturate(100%) invert(62%) sepia(97%) saturate(3195%) hue-rotate(13deg) brightness(103%) contrast(101%)",
  white: "brightness(0) invert(1)",
  black: "brightness(0)",
  muted: "brightness(0) invert(0.5)",
  blue: "brightness(0) saturate(100%) invert(42%) sepia(99%) saturate(2256%) hue-rotate(206deg) brightness(101%) contrast(98%)",
  green: "brightness(0) saturate(100%) invert(62%) sepia(45%) saturate(3025%) hue-rotate(113deg) brightness(97%) contrast(98%)",
  purple: "brightness(0) saturate(100%) invert(26%) sepia(76%) saturate(2361%) hue-rotate(264deg) brightness(96%) contrast(106%)",
};

/**
 * Sphera brand icon — uses the actual Sphera logo instead of generic Sparkles.
 * Supports multiple color variants via CSS filters.
 */
export function SpheraIcon({ className, size = "md", variant = "primary" }: SpheraIconProps) {
  return (
    <img
      src="/sphera-logo.png"
      alt=""
      aria-hidden="true"
      className={cn(SIZE_MAP[size], "object-contain flex-shrink-0", className)}
      style={{ filter: FILTER_MAP[variant] }}
    />
  );
}
