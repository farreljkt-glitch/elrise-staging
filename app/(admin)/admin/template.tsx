import type { ReactNode } from "react";

export default function AdminTemplate({ children }: { children: ReactNode }) {
  // template.tsx dibuat ulang tiap navigasi → animasi masuk halaman singkat (opacity+translate, 220ms)
  return <div className="page-enter">{children}</div>;
}
