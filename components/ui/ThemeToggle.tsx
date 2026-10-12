"use client";

import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme";

/** Tombol ikon sekali tekan (terang <-> gelap) untuk header. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
      className={`press relative grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${className}`}
    >
      <Sun className={`absolute h-[18px] w-[18px] transition-all duration-200 ${isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`} />
      <Moon className={`absolute h-[18px] w-[18px] transition-all duration-200 ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"}`} />
    </button>
  );
}

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Terang", Icon: Sun },
  { value: "dark", label: "Gelap", Icon: Moon },
  { value: "system", label: "Otomatis", Icon: Monitor },
];

/** Pemilih 3 pilihan untuk halaman Akun/Profil. */
export function ThemeSelector() {
  const { mode, setMode } = useTheme();
  return (
    <div role="radiogroup" aria-label="Tampilan" className="grid grid-cols-3 gap-1 rounded-2xl bg-[var(--surface-2)] p-1">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(value)}
            className={`press flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors ${
              active ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-[var(--teal)]" : ""}`} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
