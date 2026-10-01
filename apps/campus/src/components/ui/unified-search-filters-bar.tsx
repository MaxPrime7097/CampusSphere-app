import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UnifiedSearchFiltersBarProps
  extends React.ComponentPropsWithoutRef<typeof Card> {
  contentClassName?: string;
  /**
   * Extension exceptionnelle uniquement. Ne pas surcharger les tokens core
   * (cs-card, p-3 md:p-4, space-y-3) afin de préserver le design Connections.
   */
  exceptionalClassName?: string;
  /**
   * Extension exceptionnelle uniquement. Ne pas surcharger les tokens core
   * (cs-card, p-3 md:p-4, space-y-3) afin de préserver le design Connections.
   */
  exceptionalContentClassName?: string;
}

export function UnifiedSearchFiltersBar({
  className,
  contentClassName,
  exceptionalClassName,
  exceptionalContentClassName,
  children,
  ...props
}: UnifiedSearchFiltersBarProps) {
  return (
    <Card className={cn("cs-card", className, exceptionalClassName)} {...props}>
      <CardContent className={cn("p-3 md:p-4 space-y-3", contentClassName, exceptionalContentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
