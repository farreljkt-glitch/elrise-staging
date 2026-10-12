"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
const STORAGE_KEY = "tg_theme";

/** Skrip inline (jalan sebelum paint) agar tidak ada kedipan terang→gelap saat halaman dibuka. */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem("${STORAGE_KEY}");var d=m==="dark"||((m===null||m==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");var c=document.querySelector('meta[name="theme-color"]');if(c)c.setAttribute("content",d?"#07101c":"#f4f7fa")}catch(e){}})();`;

type Ctx = { mode: ThemeMode; resolved: "light" | "dark"; setMode: (m: ThemeMode) => void; toggle: () => void };
const ThemeContext = createContext<Ctx | null>(null);

function readStored(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const apply = useCallback((m: ThemeMode, animate: boolean) => {
    const dark = m === "dark" || (m === "system" && systemPrefersDark());
    const root = document.documentElement;
    if (animate) {
      root.classList.add("theme-switching");
      window.setTimeout(() => root.classList.remove("theme-switching"), 260);
    }
    root.setAttribute("data-theme", dark ? "dark" : "light");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#07101c" : "#f4f7fa");
    setResolved(dark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const stored = readStored();
    setModeState(stored);
    apply(stored, false);
  }, [apply]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system", true);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode, apply]);

  const setMode = useCallback(
    (m: ThemeMode) => {
      setModeState(m);
      try { localStorage.setItem(STORAGE_KEY, m); } catch { /* penyimpanan diblokir: tema tetap berlaku untuk sesi ini */ }
      apply(m, true);
    },
    [apply],
  );

  const toggle = useCallback(() => setMode(resolved === "dark" ? "light" : "dark"), [resolved, setMode]);
  const value = useMemo(() => ({ mode, resolved, setMode, toggle }), [mode, resolved, setMode, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam ThemeProvider");
  return ctx;
}
