"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  Clock,
  Camera,
  MapPin,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function PegawaiAbsenPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [timeString, setTimeString] = useState("--:--:--");
  const [dateString, setDateString] = useState("");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Modal konfirmasi
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"CHECK_IN" | "CHECK_OUT" | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/absen",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{
      if(!data?.attendance)return;
      const a=data.attendance;
      setHasCheckedIn(Boolean(a.checkInAt)); setHasCheckedOut(Boolean(a.checkOutAt));
      if(a.checkInAt)setCheckInTime(new Date(a.checkInAt).toLocaleTimeString("id-ID",{timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit",second:"2-digit"}));
      if(a.checkOutAt)setCheckOutTime(new Date(a.checkOutAt).toLocaleTimeString("id-ID",{timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    }).catch(()=>{});
  },[]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString("id-ID", {timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit",second:"2-digit"}));
      setDateString(now.toLocaleDateString("id-ID",{timeZone:"Asia/Jakarta",weekday:"long",day:"numeric",month:"long",year:"numeric"}));
    };
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isConfirmModalOpen) { streamRef.current?.getTracks().forEach(track=>track.stop()); streamRef.current=null; setIsCameraReady(false); return; }
    let cancelled=false;
    navigator.mediaDevices?.getUserMedia({video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}},audio:false})
      .then(stream=>{if(cancelled){stream.getTracks().forEach(t=>t.stop());return;}streamRef.current=stream; if(videoRef.current){videoRef.current.srcObject=stream;void videoRef.current.play();}setIsCameraReady(true);})
      .catch(()=>{setIsCameraReady(false);showToast("error","Kamera Tidak Tersedia","Izinkan akses kamera depan dan gunakan HTTPS untuk melakukan absensi.");});
    return ()=>{cancelled=true;streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;};
  },[isConfirmModalOpen,showToast]);

  const handleTriggerAction = (action: "CHECK_IN" | "CHECK_OUT") => {
    setPendingAction(action);
    setAgreeTerms(false);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!agreeTerms) { showToast("error","Persetujuan Wajib","Harap centang persetujuan pengambilan data absensi."); return; }
    if (!videoRef.current || !isCameraReady || !pendingAction) { showToast("error","Kamera Belum Siap","Aktifkan kamera sebelum mengirim absensi."); return; }
    if (!navigator.geolocation) { showToast("error","GPS Tidak Didukung","Peramban ini tidak menyediakan layanan lokasi."); return; }
    setIsSubmitting(true);
    try {
      const position=await new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:15000,maximumAge:0}));
      const video=videoRef.current; const canvas=document.createElement("canvas");
      canvas.width=video.videoWidth; canvas.height=video.videoHeight;
      if(!canvas.width||!canvas.height) throw new Error("Kamera belum menghasilkan gambar. Coba lagi.");
      const ctx=canvas.getContext("2d"); if(!ctx) throw new Error("Tidak dapat memproses foto kamera.");
      ctx.drawImage(video,0,0,canvas.width,canvas.height);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Gagal mengambil foto.")),"image/jpeg",0.78));
      const form=new FormData(); form.set("action",pendingAction); form.set("lat",String(position.coords.latitude)); form.set("lng",String(position.coords.longitude)); form.set("accuracyM",String(position.coords.accuracy)); form.set("selfie",blob,"selfie.jpg");
      const response=await fetch("/api/absen",{method:"POST",body:form}); const result=await response.json();
      if(!response.ok) throw new Error(result.message||"Absensi ditolak oleh server.");
      const serverDate=new Date(result.serverTime); const serverTime=serverDate.toLocaleTimeString("id-ID",{timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit",second:"2-digit"});
      if(pendingAction==="CHECK_IN"){setHasCheckedIn(true);setCheckInTime(serverTime);}else{setHasCheckedOut(true);setCheckOutTime(serverTime);}
      setIsConfirmModalOpen(false); showToast("success","Absensi Tercatat",result.message);
    } catch(error) {
      const message=error instanceof Error?error.message:"Absensi gagal dikirim.";
      showToast("error","Absensi Gagal",message.includes("User denied")?"Izin kamera/lokasi ditolak. Aktifkan izin browser dan coba lagi.":message);
    } finally {setIsSubmitting(false);}
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-6">
      <PageHeader
        title="Absen Mandiri"
        description="Presensi kehadiran kerja mandiri berbasis verifikasi geo-fence dan kamera."
        breadcrumbs={[{ label: "Pegawai" }, { label: "Absen" }]}
      />

      {/* CLOCK DISPLAY CARD */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-[var(--surface-2)] to-[var(--surface)] border border-[var(--border)] text-center shadow-xl">
        <span className="text-xs text-[var(--teal)] font-medium tracking-wide uppercase">
          {dateString}
        </span>
        <div className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] font-mono tabular-nums tracking-tight my-2">
          {timeString}
        </div>
        <span className="text-xs text-[var(--text-muted)]">Waktu Indonesia Barat (WIB)</span>

        {/* Status Sensor Preview */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-[var(--border)] text-[11px]">
          <div className="flex flex-col items-center gap-1">
            <Camera
              className={`w-4 h-4 ${isCameraReady ? "text-[var(--teal)]" : "text-[var(--danger)]"}`}
            />
            <span className="text-[var(--text-secondary)] font-medium">Kamera Siap</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <MapPin
              className="w-4 h-4 text-[var(--text-muted)]"
            />
            <span className="text-[var(--text-secondary)] font-medium">
              Menunggu validasi server
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Wifi
              className="w-4 h-4 text-[var(--text-muted)]"
            />
            <span className="text-[var(--text-secondary)] font-medium">IP diverifikasi server</span>
          </div>
        </div>
      </div>


      {/* BIG CHECK-IN / CHECK-OUT BUTTONS */}
      <div className="space-y-3">
        {!hasCheckedIn ? (
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleTriggerAction("CHECK_IN")}
            className="w-full h-16 text-lg font-bold shadow-2xl rounded-2xl"
            leftIcon={<Clock className="w-6 h-6" />}
          >
            CHECK IN SEKARANG
          </Button>
        ) : !hasCheckedOut ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[var(--teal)]/10 border border-[var(--teal)]/30 text-center">
              <span className="text-xs text-[var(--teal)] font-medium block">
                Anda sudah check-in pada pukul:
              </span>
              <span className="text-xl font-mono font-bold text-[var(--text-primary)] block mt-0.5">{checkInTime || "--:--:--"} WIB</span>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => handleTriggerAction("CHECK_OUT")}
              className="w-full h-14 text-base font-bold rounded-2xl border-[var(--blue)] text-[var(--blue)] hover:bg-[var(--blue)]/10"
              leftIcon={<Clock className="w-5 h-5" />}
            >
              CHECK OUT (PULANG)
            </Button>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-[var(--success)] mx-auto mb-2" />
            <span className="text-sm font-bold text-[var(--text-primary)] block">
              Absensi Hari Ini Lengkap
            </span>
            <span className="text-xs text-[var(--text-secondary)] block font-mono">
              Masuk: {checkInTime} · Pulang: {checkOutTime} WIB
            </span>
          </div>
        )}
      </div>

      {/* RIWAYAT HARI INI */}
      <Card title="Catatan Validasi Kehadiran" description="Data lokasi dan foto hanya tercatat setelah server menerima dan memvalidasinya">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
            <span className="text-[var(--text-muted)]">Lokasi Kantor:</span>
            <span className="text-[var(--text-primary)] font-medium">Kantor sesuai konfigurasi perusahaan</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
            <span className="text-[var(--text-muted)]">Akurasi GPS:</span>
            <span className="text-[var(--text-primary)] font-mono">Divalidasi server saat absen</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
            <span className="text-[var(--text-muted)]">IP Jaringan:</span>
            <span className="text-[var(--text-primary)] font-mono">Dibaca oleh server dari reverse proxy tepercaya</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">Status Validasi Wajah:</span>
            <span className="text-[var(--teal)] font-semibold">Foto diproses server</span>
          </div>
        </div>
      </Card>

      {/* MODAL KONFIRMASI ABSEN */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={pendingAction === "CHECK_IN" ? "Konfirmasi Check-In" : "Konfirmasi Check-Out"}
        description="Verifikasi kesesuaian data lokasi dan identitas sebelum menyimpan."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSubmit}
              isLoading={isSubmitting}
            >
              Kirimkan Absen
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-xl overflow-hidden bg-black border border-[var(--border)]">
            <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video object-cover" />
            <p className="p-2 text-center text-[var(--text-muted)]">Selfie langsung dari kamera depan · {isCameraReady?"Kamera siap":"Menunggu izin kamera"}</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--surface-2)] space-y-1">
            <span className="text-[var(--text-muted)] block text-[10px]">Waktu Presensi</span>
            <span className="text-lg font-bold font-mono text-[var(--text-primary)]">{timeString} WIB</span>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--surface-3)]">
            <input
              type="checkbox"
              id="termsCheckbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--teal)] mt-0.5 cursor-pointer"
            />
            <label htmlFor="termsCheckbox" className="text-[var(--text-primary)] leading-relaxed cursor-pointer select-none">
              Saya menyetujui pengambilan data absensi sesuai aturan perusahaan dan menyatakan kehadiran secara jujur.
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
