import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function Textarea({
  label,
  helperText,
  error,
  className = "",
  id,
  rows = 3,
  ...props
}: TextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-medium text-[var(--text-secondary)] select-none"
        >
          {label}
          {props.required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full rounded-lg bg-[var(--surface-2)] border ${
          error
            ? "border-[var(--danger)] focus:border-[var(--danger)]"
            : "border-[var(--border)] focus:border-[var(--blue)]"
        } text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm p-3 transition-colors focus:outline-none focus:ring-1 ${
          error ? "focus:ring-[var(--danger)]" : "focus:ring-[var(--blue)]"
        } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-[11px] text-[var(--danger)]">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-[var(--text-muted)]">{helperText}</span>
      ) : null}
    </div>
  );
}
