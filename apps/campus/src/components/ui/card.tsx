import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────
   Card System — 3 intentional variants
   
   default  : Standard card. Most UI elements.
   ghost    : No background. Border only. For subtle containers.
   flat     : No border, no shadow. For nested/embedded contexts.
────────────────────────────────────────────── */

const cardVariants = cva(
  "rounded-[var(--radius)] text-card-foreground transition-[box-shadow,transform,border-color] duration-200",
  {
    variants: {
      variant: {
        default: "cs-card",
        raised:  "cs-card",
        ghost:   "cs-card-ghost",
        flat:    "bg-card border-0 shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

/* ── Sub-components ─────────────────────────── */

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 p-5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-subhead text-card-foreground", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-caption leading-snug", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 p-5 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

/* ── Section header pattern ─────────────────── 
   Standardized header row for any card section.
   Usage: <CardSection title="Suggestions" action={<button>Voir tout</button>} />
──────────────────────────────────────────────  */

interface CardSectionProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

const CardSection = ({ title, action, className }: CardSectionProps) => (
  <div className={cn("flex items-center justify-between px-5 pt-5 pb-3", className)}>
    <span className="cs-section-title">{title}</span>
    {action && (
      <span className="text-xs font-medium text-primary hover:underline cursor-pointer">
        {action}
      </span>
    )}
  </div>
);
CardSection.displayName = "CardSection";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardSection,
};
