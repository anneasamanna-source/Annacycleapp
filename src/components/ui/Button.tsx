import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "accent" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-forest text-ivory hover:bg-forest/90",
  secondary: "border border-charcoal/20 bg-white text-forest hover:bg-forest/5",
  accent: "bg-harvest text-charcoal hover:bg-harvest/90",
  ghost: "text-forest hover:bg-forest/5",
};

// min-h-11 = 44px, min-h-12 = 48px: comfortable touch targets.
const sizes: Record<Size, string> = {
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-6 text-base",
};

type StyleProps = { variant?: Variant; size?: Size; className?: string };

export function buttonStyles({ variant = "primary", size = "md", className }: StyleProps) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return <button type="button" className={buttonStyles({ variant, size, className })} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
