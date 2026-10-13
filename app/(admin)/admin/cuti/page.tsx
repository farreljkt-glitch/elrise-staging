"use client";
import Link from "next/link";
import {LeaveReviewPanel} from "@/components/leave/LeaveReviewPanel";
export default function AdminLeavePage(){return <div className="space-y-4"><div className="px-5 pt-4"><Link href="/admin/cuti/pengaturan" className="inline-block rounded border px-3 py-2 text-sm">Pengaturan Jenis & Kuota Cuti →</Link></div><LeaveReviewPanel/></div>}
