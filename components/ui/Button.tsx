"use client";

/**
 * Warm Farmhouse design system — Button.
 * Primary: muted olive, white text. Secondary: white bg, olive border. Destructive: terracotta.
 * Rounded-lg, focus ring for accessibility.
 */

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand-accent text-white border-transparent hover:bg-brand-accent/90 focus-visible:ring-brand-accent",
  secondary:
    "bg-white text-brand-accent border-2 border-brand-accent hover:bg-brand-light/80 focus-visible:ring-brand-accent",
  destructive:
    "bg-brand-terracotta/90 text-white border-transparent hover:bg-brand-terracotta focus-visible:ring-brand-terracotta",
  ghost:
    "bg-transparent text-brand border border-brand/20 hover:bg-brand-light/60 focus-visible:ring-brand",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition shadow-farmhouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-light disabled:opacity-50 disabled:pointer-events-none border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    />
  );
}
