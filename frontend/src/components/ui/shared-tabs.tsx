import * as React from "react";

import { cn } from "@/lib/utils";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const sharedTabsListClasses =
  "inline-flex h-auto min-w-max items-center justify-start rounded-xl bg-muted/50 p-1 text-muted-foreground";

const sharedTabsTriggerClasses =
  "inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm";

interface SharedTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsList> {
  containerClassName?: string;
}

const SharedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  SharedTabsListProps
>(({ className, containerClassName, ...props }, ref) => (
  <div
    className={cn(
      "w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      containerClassName,
    )}
  >
    <TabsList ref={ref} className={cn(sharedTabsListClasses, className)} {...props} />
  </div>
));
SharedTabsList.displayName = "SharedTabsList";

const SharedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTrigger>,
  React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, ...props }, ref) => (
  <TabsTrigger
    ref={ref}
    className={cn(sharedTabsTriggerClasses, className)}
    {...props}
  />
));
SharedTabsTrigger.displayName = "SharedTabsTrigger";

export { SharedTabsList, SharedTabsTrigger };
