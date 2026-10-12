import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export function Select({
  label,
  helperText,
  error,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-[var(--text-secondary)] select-none"
        >
          {label}
          {props.required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <select
          id={selectId}
          className={`w-full h-10 rounded-lg bg-[var(--surface-2)] border ${
            error
              ? "border-[var(--danger)] focus:border-[var(--danger)]"
              : "border-[var(--border)] focus:border-[var(--blue)]"
          } text-[var(--text-primary)] text-sm px-3.5 pr-10 appearance-none transition-colors focus:outline-none focus:ring-1 ${
            error ? "focus:ring-[var(--danger)]" : "focus:ring-[var(--blue)]"
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[var(--surface-2)] text-[var(--text-primary)]">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 text-[var(--text-muted)] pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error ? (
        <span className="text-[11px] text-[var(--danger)]">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-[var(--text-muted)]">{helperText}</span>
      ) : null}
    </div>
  );
}
