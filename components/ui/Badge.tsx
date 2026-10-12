import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  dot = false,
}: BadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  }[size];

  const variantStyles = {
    success: {
      bg: "bg-[var(--success)]/10",
      border: "border-[var(--success)]/30",
      text: "text-[var(--success)]",
      dotBg: "bg-[var(--success)]",
    },
    warning: {
      bg: "bg-[var(--warning)]/10",
      border: "border-[var(--warning)]/30",
      text: "text-[var(--warning)]",
      dotBg: "bg-[var(--warning)]",
    },
    danger: {
      bg: "bg-[var(--danger)]/10",
      border: "border-[var(--danger)]/30",
      text: "text-[var(--danger)]",
      dotBg: "bg-[var(--danger)]",
    },
    info: {
      bg: "bg-[var(--blue)]/10",
      border: "border-[var(--blue)]/30",
      text: "text-[var(--info)]",
      dotBg: "bg-[var(--blue)]",
    },
    neutral: {
      bg: "bg-[var(--surface-3)]",
      border: "border-[var(--border)]",
      text: "text-[var(--text-secondary)]",
      dotBg: "bg-[var(--text-muted)]",
    },
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${sizeClasses} ${variantStyles.bg} ${variantStyles.border} ${variantStyles.text} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variantStyles.dotBg}`} />}
      <span>{children}</span>
    </span>
  );
}
