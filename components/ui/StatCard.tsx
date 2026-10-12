import React from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: "blue" | "teal" | "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon,
  trend,
  accentColor = "blue",
  className = "",
}: StatCardProps) {
  const accentGlow = {
    blue: "group-hover:border-[var(--blue)]/50",
    teal: "group-hover:border-[var(--teal)]/50",
    success: "group-hover:border-[var(--success)]/50",
    warning: "group-hover:border-[var(--warning)]/50",
    danger: "group-hover:border-[var(--danger)]/50",
    info: "group-hover:border-[var(--info)]/50",
    neutral: "group-hover:border-[var(--border)]",
  }[accentColor];

  const iconBg = {
    blue: "bg-[var(--blue)]/10 text-[var(--blue)]",
    teal: "bg-[var(--teal)]/10 text-[var(--teal)]",
    success: "bg-[var(--success)]/10 text-[var(--success)]",
    warning: "bg-[var(--warning)]/10 text-[var(--warning)]",
    danger: "bg-[var(--danger)]/10 text-[var(--danger)]",
    info: "bg-[var(--info)]/10 text-[var(--info)]",
    neutral: "bg-[var(--surface-3)] text-[var(--text-muted)]",
  }[accentColor];

  return (
    <div
      className={`group p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] transition-all duration-200 ${accentGlow} flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-mono tabular-nums">
          {value}
        </div>

        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={`text-xs font-semibold font-mono tabular-nums ${
                trend.isPositive ? "text-[var(--success)]" : "text-[var(--danger)]"
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtext && (
            <span className="text-xs text-[var(--text-muted)] truncate">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
}
