import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <Inbox className="w-10 h-10 text-[var(--text-muted)]" />,
  title = "Tidak ada data",
  description = "Belum ada rekaman data yang tersedia untuk ditampilkan saat ini.",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)]/50 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-4 text-[var(--text-muted)] shadow-inner">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-[var(--text-primary)]">
        {title}
      </h4>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
