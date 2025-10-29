import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback,
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+",
  width,
  height,
  priority = false
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Convert to WebP if supported
  const getOptimizedSrc = (originalSrc: string) => {
    if (typeof window === 'undefined') return originalSrc;
    
    // Check if browser supports WebP
    const canvas = document.createElement('canvas');
    const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    if (supportsWebP && originalSrc.includes('.')) {
      const extension = originalSrc.split('.').pop();
      return originalSrc.replace(`.${extension}`, '.webp');
    }
    
    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        className
      )}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse"
          style={{ 
            backgroundImage: `url(${placeholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={hasError ? (fallback || src) : getOptimizedSrc(src)}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
}
