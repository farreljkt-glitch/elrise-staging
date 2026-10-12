import React from "react";
import Image from "next/image";

interface LogoProps {
  /** icon = monogram saja · wordmark = "elrise." · full = wordmark + nama produk · lockup = ikon di atas wordmark (login/splash) */
  variant?: "full" | "icon" | "wordmark" | "lockup";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ICON_H = { sm: 30, md: 38, lg: 52 } as const;
const WORD_H = { sm: 22, md: 28, lg: 38 } as const;
const LOCKUP_W = { sm: 96, md: 132, lg: 176 } as const;

/** Memasang dua gambar (terang/gelap); CSS (.logo-light/.logo-dark) menampilkan salah satu sesuai tema, tanpa flash. */
function Themed({ name, width, height, alt, priority = false }: { name: string; width: number; height: number; alt: string; priority?: boolean }) {
  return (
    <>
      <Image className="logo-light select-none" src={`/brand/${name}-light.png`} alt={alt} width={width} height={height} unoptimized priority={priority} draggable={false} />
      <Image className="logo-dark select-none" src={`/brand/${name}-dark.png`} alt="" aria-hidden width={width} height={height} unoptimized priority={priority} draggable={false} />
    </>
  );
}

/** Logo elrise (aset resmi di public/brand/). Produk: Terhubung Gajiku. */
export function Logo({ variant = "full", className = "", size = "md" }: LogoProps) {
  if (variant === "icon") {
    const h = ICON_H[size];
    const w = Math.round((h * 265) / 292);
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`}>
        <Themed name="icon" width={w} height={h} alt="elrise" />
      </span>
    );
  }

  if (variant === "lockup") {
    const w = LOCKUP_W[size];
    const h = Math.round((w * 828) / 688);
    return (
      <span className={`inline-flex items-center ${className}`}>
        <Themed name="lockup" width={w} height={h} alt="elrise" priority />
      </span>
    );
  }

  const h = WORD_H[size];
  const w = Math.round((h * 640) / 211);
  const word = <Themed name="wordmark" width={w} height={h} alt="elrise" />;

  if (variant === "wordmark") return <span className={`inline-flex items-center ${className}`}>{word}</span>;

  return (
    <span className={`inline-flex flex-col items-start gap-1 leading-none ${className}`}>
      {word}
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Terhubung Gajiku</span>
    </span>
  );
}
