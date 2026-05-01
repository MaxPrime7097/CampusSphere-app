import { useState, forwardRef, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  containerClassName?: string;
}

/**
 * Simplified image component to avoid loading issues while keeping fallback support.
 */
export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  className,
  containerClassName,
  fallback = "/placeholder-image.jpg",
  ...props
}, ref) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-muted", containerClassName)}>
      <img
        ref={ref}
        src={hasError || !src ? fallback : src}
        alt={alt || "image"}
        className={cn("w-full h-full object-cover", className)}
        onError={() => setHasError(true)}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";
