import * as React from "react";

import { cn } from "@/lib/utils";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const sharedTabsListClasses =
  "grid grid-flow-col text-center border-b border-gray-200 text-gray-500";

const sharedTabsTriggerClasses =
  "w-full flex justify-center border-b-4 border-transparent py-4 transition-all duration-200 text-sm font-medium hover:text-primary hover:border-primary data-[state=active]:border-primary data-[state=active]:text-primary";

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
