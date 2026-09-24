import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────
   Button hierarchy
   
   primary    : Orange fill — ONE per view, main CTA
   secondary  : Neutral fill — secondary actions
   outline    : Border only — tertiary actions
   ghost      : No bg, no border — icon buttons, nav items
   danger     : Red fill — destructive, irreversible actions
   link       : Text only — inline links
────────────────────────────────────────────── */

const buttonVariants = cva(
  [
    "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-[background-color,box-shadow,transform,opacity] duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:scale-[0.97]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /* Primary — orange, used sparingly */
        primary:
          "rounded-[var(--radius-sm)] bg-primary text-primary-foreground shadow-sm " +
          "hover:bg-primary/90 active:bg-primary/95",

        /* Default alias for primary (backwards compat) */
        default:
          "rounded-[var(--radius-sm)] bg-primary text-primary-foreground shadow-sm " +
          "hover:bg-primary/90 active:bg-primary/95",

        /* Secondary — neutral, frequent use */
        secondary:
          "rounded-[var(--radius-sm)] bg-secondary text-secondary-foreground " +
          "hover:bg-secondary/70",

        /* Outline — bordered, transparent bg */
        outline:
          "rounded-[var(--radius-sm)] border border-border bg-transparent text-foreground " +
          "hover:bg-accent hover:border-border/80",

        /* Ghost — invisible until hover */
        ghost:
          "rounded-[var(--radius-sm)] bg-transparent text-foreground " +
          "hover:bg-accent hover:text-foreground",

        /* Danger — destructive actions */
        danger:
          "rounded-[var(--radius-sm)] bg-destructive text-destructive-foreground shadow-sm " +
          "hover:bg-destructive/85",

        /* Backwards compat */
        destructive:
          "rounded-[var(--radius-sm)] bg-destructive text-destructive-foreground shadow-sm " +
          "hover:bg-destructive/85",

        /* Link — inline text */
        link:
          "rounded-sm bg-transparent text-primary underline-offset-4 " +
          "hover:underline p-0 h-auto",
      },

      size: {
        xs:      "h-7 px-2.5 text-xs [&_svg]:size-3",
        sm:      "h-8 px-3 text-sm [&_svg]:size-3.5",
        default: "h-9 px-4 text-sm [&_svg]:size-4",
        lg:      "h-11 px-6 text-base [&_svg]:size-4",
        xl:      "h-12 px-8 text-base [&_svg]:size-5",
        icon:    "h-9 w-9 [&_svg]:size-4",
        "icon-sm": "h-7 w-7 [&_svg]:size-3.5",
        "icon-lg": "h-11 w-11 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
