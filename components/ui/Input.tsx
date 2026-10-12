import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[var(--text-secondary)] select-none"
        >
          {label}
          {props.required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full h-10 rounded-lg bg-[var(--surface-2)] border ${
            error
              ? "border-[var(--danger)] focus:border-[var(--danger)]"
              : "border-[var(--border)] focus:border-[var(--blue)]"
          } text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm px-3.5 transition-colors focus:outline-none focus:ring-1 ${
            error ? "focus:ring-[var(--danger)]" : "focus:ring-[var(--blue)]"
          } disabled:opacity-50 disabled:cursor-not-allowed ${
            leftIcon ? "pl-9" : ""
          } ${rightIcon ? "pr-9" : ""} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-[var(--text-muted)] flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <span className="text-[11px] text-[var(--danger)]">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-[var(--text-muted)]">{helperText}</span>
      ) : null}
    </div>
  );
}
