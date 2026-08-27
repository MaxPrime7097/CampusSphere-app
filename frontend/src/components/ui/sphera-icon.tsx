import { cn } from "@/lib/utils";

interface SpheraIconProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  xl: "w-8 h-8",
};

/**
 * Sphera brand icon — uses the actual Sphera logo instead of generic Sparkles.
 * The CSS filter tints it to match hsl(var(--primary)) = orange.
 */
export function SpheraIcon({ className, size = "md" }: SpheraIconProps) {
  return (
    <img
      src="/sphera-logo.png"
      alt=""
      aria-hidden="true"
      className={cn(SIZE_MAP[size], "object-contain flex-shrink-0", className)}
      style={{
        filter:
          "brightness(0) saturate(100%) invert(62%) sepia(97%) saturate(3195%) hue-rotate(13deg) brightness(103%) contrast(101%)",
      }}
    />
  );
}
