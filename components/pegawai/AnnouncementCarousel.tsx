"use client";

import React, { useRef, useState } from "react";
import { Megaphone } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import type { Announcement } from "@/lib/mock-data/announcements";

export function AnnouncementCarousel({ items }: { items: Announcement[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i: number) => {
    const el = ref.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div>
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-[20px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((a) => (
          <article key={a.id} className="m-card w-full shrink-0 snap-center p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[image:var(--grad-soft)] text-[var(--teal)]">
                <Megaphone className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{a.title}</h3>
                <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">{a.body}</p>
                <p className="mt-2 text-[11px] font-medium text-[var(--text-muted)]">{formatDate(a.date)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Pilih pengumuman">
          {items.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Pengumuman ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${i === index ? "w-5 bg-[var(--teal)]" : "w-1.5 bg-[var(--border)]"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
