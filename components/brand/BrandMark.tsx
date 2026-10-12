import React from "react";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/constants";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col text-xs text-[var(--text-muted)] ${className}`}>
      <span className="font-semibold text-[var(--text-secondary)]">{BRAND_NAME}</span>
      <span className="text-[10px]">{BRAND_TAGLINE}</span>
    </div>
  );
}
