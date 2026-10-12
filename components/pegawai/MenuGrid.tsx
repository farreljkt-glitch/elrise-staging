"use client";

import React from "react";
import Link from "next/link";
import { PEGAWAI_MENU } from "@/lib/pegawai-menu";

export function MenuGrid({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid grid-cols-4 gap-x-2 gap-y-5 ${className}`}>
      {PEGAWAI_MENU.map(({ label, href, icon: Icon, soon }, i) => {
        const inner = (
          <>
            <span className="m-menu-icon relative">
              <Icon className="h-6 w-6" strokeWidth={1.9} />
              {soon && (
                <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)] ring-2 ring-[var(--bg)]">
                  Segera
                </span>
              )}
            </span>
            <span className="text-center text-[12px] font-medium leading-tight text-[var(--text-secondary)]">{label}</span>
          </>
        );
        return (
          <li key={label} className="anim-pop" style={{ "--i": i } as React.CSSProperties}>
            {soon ? (
              <div aria-disabled="true" className="flex flex-col items-center gap-2 opacity-60">{inner}</div>
            ) : (
              <Link href={href} prefetch className="press flex flex-col items-center gap-2">{inner}</Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
