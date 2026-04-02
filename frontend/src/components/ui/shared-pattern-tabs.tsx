import * as React from "react";

import { cn } from "@/lib/utils";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const sharedPatternTabsListClasses =
  "grid w-full auto-cols-fr grid-flow-col items-end border-b border-border bg-transparent p-0 text-muted-foreground";

const sharedPatternTabsTriggerClasses =
  "relative h-11 rounded-none border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none";

interface SharedPatternTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsList> {
  containerClassName?: string;
}

const SharedPatternTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  SharedPatternTabsListProps
>(({ className, containerClassName, ...props }, ref) => (
  <div
    className={cn(
      "w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      containerClassName,
    )}
  >
    <TabsList ref={ref} className={cn(sharedPatternTabsListClasses, className)} {...props} />
  </div>
));
SharedPatternTabsList.displayName = "SharedPatternTabsList";

const SharedPatternTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTrigger>,
  React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, ...props }, ref) => (
  <TabsTrigger
    ref={ref}
    className={cn(sharedPatternTabsTriggerClasses, className)}
    {...props}
  />
));
SharedPatternTabsTrigger.displayName = "SharedPatternTabsTrigger";

export { SharedPatternTabsList, SharedPatternTabsTrigger };
