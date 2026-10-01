import { cn } from "../cn";

export interface SpheraIconProps {
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

/**
 * Sphera brand icon — uses the actual Sphera logo.
 * Uses mask-image to perfectly inherit text colors or Tailwind backgrounds.
 */
export function SpheraIcon({ className, size = "md", variant }: SpheraIconProps) {
  const bgClass = variant === "primary" ? "bg-primary" : 
                  variant === "white" ? "bg-white" : 
                  variant === "black" ? "bg-black" : 
                  variant === "muted" ? "bg-muted-foreground" : 
                  variant === "blue" ? "bg-blue-500" :
                  variant === "green" ? "bg-green-500" :
                  variant === "purple" ? "bg-purple-500" :
                  "bg-current"; // Fallback to current text color

  return (
    <span
      aria-hidden="true"
      className={cn(SIZE_MAP[size], "inline-block flex-shrink-0 align-middle", bgClass, className)}
      style={{
        WebkitMaskImage: 'url(/sphera-logo.png)',
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: 'url(/sphera-logo.png)',
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
  );
}
