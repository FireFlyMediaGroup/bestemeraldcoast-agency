import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// Placeholder Button primitive (ADR-037 component contract).
// Reads every color, font, and radius from CSS variables — switching the
// archetype on an ancestor (`.archetype-coastal`, etc.) repaints automatically
// without touching this component.

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-fg hover:opacity-90 focus-visible:outline-primary",
  secondary:
    "bg-accent text-accent-fg hover:opacity-90 focus-visible:outline-accent",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted focus-visible:outline-primary",
  ghost:
    "bg-transparent text-foreground hover:bg-muted focus-visible:outline-primary",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-(--radius-sm)",
  md: "px-4 py-2 text-base rounded-(--radius-md)",
  lg: "px-6 py-3 text-lg rounded-(--radius-lg)",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center font-medium transition " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "cursor-pointer select-none";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, type, ...rest },
  ref,
) {
  const classes = [
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button ref={ref} type={type ?? "button"} className={classes} {...rest}>
      {children}
    </button>
  );
});
