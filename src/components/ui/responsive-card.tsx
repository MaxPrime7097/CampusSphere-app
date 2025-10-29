import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  header?: ReactNode;
  content?: ReactNode;
}

export function ResponsiveCard({ 
  children, 
  className, 
  title, 
  header, 
  content 
}: ResponsiveCardProps) {
  return (
    <Card className={cn(
      "campus-card w-full max-w-full overflow-hidden",
      // Mobile optimizations
      "sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl",
      // Ensure cards don't exceed screen width
      "min-w-0 flex-shrink-0",
      className
    )}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg truncate">{title}</CardTitle>
        </CardHeader>
      )}
      {header && <CardHeader className="pb-3">{header}</CardHeader>}
      {content && <CardContent>{content}</CardContent>}
      {children}
    </Card>
  );
}

// Grid container for responsive cards
interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  minWidth?: string;
}

export function ResponsiveGrid({ 
  children, 
  className, 
  minWidth = "280px" 
}: ResponsiveGridProps) {
  return (
    <div 
      className={cn(
        "grid gap-4 w-full",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        "auto-rows-max",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`
      }}
    >
      {children}
    </div>
  );
}
