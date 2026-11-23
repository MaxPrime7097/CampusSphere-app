import React from "react";
import { motion, MotionConfig, type Variants } from "motion/react";

export const PUBLIC_EASE = [0.22, 1, 0.36, 1] as const;

export const VIEWPORT_ONCE = { once: true, amount: 0.14 } as const;

export function PublicMotionProvider({ children }: { children: React.ReactNode }): JSX.Element {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  scale?: number;
  /** Animate immediately on mount (for above-the-fold Hero elements) instead of waiting for scroll */
  mount?: boolean;
  as?: "div" | "article" | "section" | "header" | "p" | "span";
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export function Reveal({
  children,
  className,
  style,
  delay = 0,
  duration = 0.52,
  y = 18,
  x = 0,
  scale = 1,
  mount = false,
  as = "div",
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: RevealProps): JSX.Element {
  const Component = motion[as] as typeof motion.div;
  const initial = { opacity: 0, y, x, scale };
  const target = { opacity: 1, y: 0, x: 0, scale: 1 };

  return (
    <Component
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={className}
      style={style}
      initial={initial}
      {...(mount
        ? { animate: target }
        : { whileInView: target, viewport: VIEWPORT_ONCE })}
      transition={{ duration, delay, ease: PUBLIC_EASE }}
    >
      {children}
    </Component>
  );
}

interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
  delayChildren?: number;
  mount?: boolean;
  as?: "div" | "ul";
}

export function StaggerGrid({
  children,
  className,
  style,
  stagger = 0.065,
  delayChildren = 0.04,
  mount = false,
  as = "div",
}: StaggerGridProps): JSX.Element {
  const Component = motion[as] as typeof motion.div;
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
  };

  return (
    <Component
      className={className}
      style={style}
      variants={variants}
      initial="hidden"
      {...(mount
        ? { animate: "visible" }
        : { whileInView: "visible", viewport: VIEWPORT_ONCE })}
    >
      {children}
    </Component>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  y?: number;
  as?: "div" | "article" | "li";
}

export function StaggerItem({
  children,
  className,
  style,
  y = 18,
  as = "div",
}: StaggerItemProps): JSX.Element {
  const Component = motion[as] as typeof motion.div;
  const variants: Variants = {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.48,
        ease: PUBLIC_EASE,
      },
    },
  };

  return (
    <Component className={className} style={style} variants={variants}>
      {children}
    </Component>
  );
}
