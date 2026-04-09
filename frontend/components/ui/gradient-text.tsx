"use client";

import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "p";
  variant?: "accent" | "highlight" | "primary";
}

/**
 * Renders text with the neon accent color.
 * Since the design direction is NO gradients,
 * this uses solid accent colors instead.
 */
export function GradientText({
  children,
  className,
  as: Tag = "span",
  variant = "accent",
}: GradientTextProps) {
  const variantClasses = {
    accent: "text-accent",
    highlight: "text-highlight",
    primary: "text-primary",
  };

  return (
    <Tag className={cn(variantClasses[variant], className)}>
      {children}
    </Tag>
  );
}
