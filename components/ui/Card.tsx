import React from "react";

export interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Card({
  children,
  title,
  description,
  action,
  className = "",
  bodyClassName = "",
}: CardProps) {
  const hasHeader = title || description || action;

  return (
    <div
      className={`rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden ${className}`}
    >
      {hasHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]/30">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
