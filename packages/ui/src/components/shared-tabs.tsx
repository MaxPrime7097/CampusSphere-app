import * as React from "react";
import { cn } from "../cn";
import { TabsList, TabsTrigger } from "./tabs";

const sharedTabsListClasses =
  "inline-grid grid-flow-col text-center border-b border-gray-200 text-gray-500 min-w-full";

const sharedTabsTriggerClasses =
  "w-full flex justify-center border-b-4 border-transparent py-4 px-4 whitespace-nowrap transition-all duration-200 text-sm font-medium hover:text-primary hover:border-primary data-[state=active]:border-primary data-[state=active]:text-primary";

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
  SharedTabsTriggerProps
>(({ className, ...props }, ref) => (
  <TabsTrigger
    ref={ref}
    className={cn(sharedTabsTriggerClasses, className)}
    {...props}
  />
));
SharedTabsTrigger.displayName = "SharedTabsTrigger";

type SharedTabsTriggerProps = React.ComponentPropsWithoutRef<typeof TabsTrigger>;

export { SharedTabsList, SharedTabsTrigger };
