import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../cn";

/* ──────────────────────────────────────────────
   Badge system
   
   default     : Orange — reserved for notifications, unread counts
   secondary   : Neutral gray — categories, tags
   success     : Green — verified, confirmed
   warning     : Amber — pending, in review  
   destructive : Red — error, rejected
   outline     : Transparent with border — subtle labels
   muted       : Very subtle — tertiary info
────────────────────────────────────────────── */

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground text-[11px] tracking-wide",
        secondary:   "bg-secondary text-secondary-foreground text-[11px]",
        success:     "bg-success/12 text-success dark:bg-success/20 text-[11px]",
        warning:     "bg-warning/12 text-warning-foreground dark:bg-warning/20 text-[11px]",
        destructive: "bg-destructive/12 text-destructive dark:bg-destructive/20 text-[11px]",
        outline:     "border border-border text-foreground text-[11px]",
        muted:       "bg-muted text-muted-foreground text-[11px]",
      },
      size: {
        sm: "px-1.5 py-0 text-[10px]",
        md: "px-2 py-0.5 text-[11px]",
        lg: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
