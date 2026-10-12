import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}: ButtonProps) {
  // Ukuran tombol
  const sizeClasses = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
    md: "h-10 px-4 text-sm gap-2 rounded-lg",
    lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
  }[size];

  // Varian gaya
  const variantClasses = {
    primary:
      "text-[var(--on-accent)] shadow-md hover:brightness-110 active:brightness-95 border-0 focus-visible:ring-2 focus-visible:ring-[var(--teal)]/50",
    secondary:
      "bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-3)] border border-[var(--border)] focus-visible:ring-2 focus-visible:ring-[var(--blue)]/40",
    outline:
      "bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface)] border border-[var(--border)] focus-visible:ring-2 focus-visible:ring-[var(--blue)]/40",
    danger:
      "bg-[#b42318] text-white hover:bg-[#912018] border-0 focus-visible:ring-2 focus-visible:ring-red-400/50",
    ghost:
      "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] border-0",
  }[variant];

  const primaryInlineStyle =
    variant === "primary"
      ? {
          background: "var(--grad)",
        }
      : undefined;

  return (
    <button
      disabled={disabled || isLoading}
      style={primaryInlineStyle}
      className={`inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150 press select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
