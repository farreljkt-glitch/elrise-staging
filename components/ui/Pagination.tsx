import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)] ${className}`}>
      <div>
        {totalItems !== undefined && itemsPerPage !== undefined ? (
          <span>
            Menampilkan{" "}
            <strong className="text-[var(--text-primary)] font-mono tabular-nums">
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
            </strong>
            –
            <strong className="text-[var(--text-primary)] font-mono tabular-nums">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </strong>{" "}
            dari <strong className="text-[var(--text-primary)] font-mono tabular-nums">{totalItems}</strong> data
          </span>
        ) : (
          <span>
            Halaman <strong className="text-[var(--text-primary)] font-mono tabular-nums">{currentPage}</strong> dari{" "}
            <strong className="text-[var(--text-primary)] font-mono tabular-nums">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          // Hanya tampilkan halaman di dekat current page jika total > 5
          if (totalPages > 5 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
            return null;
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium font-mono tabular-nums transition-colors cursor-pointer ${
                p === currentPage
                  ? "bg-[image:var(--grad)] text-[var(--on-accent)] font-bold"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
              }`}
            >
              {p}
            </button>
          );
        })}

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
