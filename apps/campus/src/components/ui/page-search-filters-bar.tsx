import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageSearchFiltersBarProps
  extends React.ComponentPropsWithoutRef<typeof Card> {
  contentClassName?: string;
}

export function PageSearchFiltersBar({
  className,
  contentClassName,
  children,
  ...props
}: PageSearchFiltersBarProps) {
  return (
    <Card className={cn(className)} {...props}>
      <CardContent className={cn("p-3 md:p-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
