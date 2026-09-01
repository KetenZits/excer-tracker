import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "md" | "lg" | "xl" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "bg-surface-2 text-foreground hover:bg-border",
  ghost: "bg-transparent text-foreground hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90",
  outline: "border border-border bg-surface text-foreground hover:bg-surface-2",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  xl: "h-14 px-6 text-base font-semibold",
  icon: "size-11",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
