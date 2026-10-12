import React from "react";

export interface LoadingStateProps {
  rows?: number;
  className?: string;
  type?: "table" | "cards";
}

export function LoadingState({ rows = 4, className = "", type = "table" }: LoadingStateProps) {
  if (type === "cards") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse flex flex-col gap-3"
          >
            <div className="h-4 bg-[var(--surface-3)] rounded w-1/3" />
            <div className="h-8 bg-[var(--surface-3)] rounded w-2/3" />
            <div className="h-3 bg-[var(--surface-3)] rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] ${className}`}>
      <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)]/40 flex items-center gap-4">
        <div className="h-4 bg-[var(--surface-3)] rounded w-1/4 animate-pulse" />
        <div className="h-4 bg-[var(--surface-3)] rounded w-1/4 animate-pulse" />
        <div className="h-4 bg-[var(--surface-3)] rounded w-1/4 animate-pulse" />
        <div className="h-4 bg-[var(--surface-3)] rounded w-1/4 animate-pulse" />
      </div>
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
            <div className="h-4 bg-[var(--surface-2)] rounded w-1/5" />
            <div className="h-4 bg-[var(--surface-2)] rounded w-2/5" />
            <div className="h-4 bg-[var(--surface-2)] rounded w-1/5" />
            <div className="h-4 bg-[var(--surface-2)] rounded w-1/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
