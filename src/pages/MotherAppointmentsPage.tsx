import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarX,
  CheckCircle,
  Clock,
  FileText,
  Hash,
  HelpCircle,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type Props = {
  user: User;
  onBack: () => void;
};

type Appointment = {
  id: number;
  mother_id: string | null;
  nurse_id: string | null;
  title: string | null;
  description: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  created_at: string;
};

const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" };
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" };

export default function MotherAppointmentsPage({
  user,
  onBack,
}: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("mother_id", user.id)
        .order("appointment_date", {
          ascending: true,
        });

      if (error) throw error;

      setAppointments(data || []);
    } catch (error: unknown) {
      console.error("Load appointments error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "ไม่สามารถโหลดข้อมูลนัดหมายได้"
      );
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const formatDate = (date: string | null) => {
    if (!date) return "-";

    return new Date(date + "T00:00:00").toLocaleDateString(
      "th-TH",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  const formatTime = (time: string | null) => {
    if (!time) return "-";
    return time.slice(0, 5) + " น.";
  };

  const getStatus = (status: string | null) => {
    switch (status) {
      case "scheduled":
        return {
          label: "รอเข้ารับบริการ",
          style: "bg-sky-100 text-sky-700",
          bar: "bg-sky-300",
          icon: CalendarClock,
        };

      case "completed":
        return {
          label: "เข้ารับบริการแล้ว",
          style: "bg-emerald-100 text-emerald-700",
          bar: "bg-emerald-300",
          icon: CheckCircle,
        };

      case "cancelled":
        return {
          label: "ยกเลิกนัดหมาย",
          style: "bg-rose-100 text-rose-700",
          bar: "bg-rose-300",
          icon: CalendarX,
        };

      default:
        return {
          label: status || "รอยืนยัน",
          style: "bg-slate-100 text-slate-700",
          bar: "bg-slate-300",
          icon: HelpCircle,
        };
    }
  };

  const scheduledCount = appointments.filter(
    (a) => a.status === "scheduled"
  ).length;

  return (
    <main className="min-h-screen bg-[#FFF8F3] pb-12 text-slate-700" style={fontBody}>
      {/* ---------- ส่วนหัว ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-sky-200 via-sky-100 to-pink-100 px-4 pt-6 pb-14 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
        <div className="relative max-w-5xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-white/70 px-4 text-[16px] font-semibold text-sky-700 shadow-sm transition hover:bg-white active:scale-95"
          >
            <ArrowLeft size={20} />
            กลับหน้าหลัก
          </button>

          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-sky-500 shadow-sm">
              <CalendarDays size={28} />
            </div>
            <div>
              <h1 className="text-[26px] font-bold leading-tight text-slate-800" style={fontHead}>
                นัดหมายของฉัน
              </h1>
              <p className="text-[15px] text-slate-600">
                ตรวจสอบวันและเวลานัดหมายจากพยาบาล
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-4 -mt-8 space-y-5">
        {/* ---------- สรุป ---------- */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(14,165,233,0.45)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-500">
              <CalendarDays size={20} />
            </span>
            <p className="mt-2 text-[34px] font-bold leading-tight text-sky-500" style={fontHead}>
              {appointments.length}
            </p>
            <p className="text-[14px] text-slate-500">นัดหมายทั้งหมด</p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(245,158,11,0.45)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-500">
              <CalendarCheck size={20} />
            </span>
            <p className="mt-2 text-[34px] font-bold leading-tight text-amber-500" style={fontHead}>
              {scheduledCount}
            </p>
            <p className="text-[14px] text-slate-500">รอเข้ารับบริการ</p>
          </div>
        </div>

        {message && (
          <div
            role="alert"
            className="rounded-3xl border border-red-100 bg-red-50 p-5 text-[15px] text-red-700"
          >
            <p className="flex items-start gap-3">
              <AlertCircle size={22} className="shrink-0" />
              {message}
            </p>

            <button
              type="button"
              onClick={loadAppointments}
              className="mt-4 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[16px] font-semibold text-red-600 shadow-sm transition active:scale-95"
            >
              <RefreshCw size={18} />
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {/* ---------- รายการนัดหมาย ---------- */}
        <section className="rounded-3xl border border-pink-100 bg-white p-5 md:p-7 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-[20px] font-bold text-slate-800" style={fontHead}>
              รายการนัดหมาย
            </h2>

            <button
              type="button"
              onClick={loadAppointments}
              disabled={loading}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-sky-100 px-4 text-[15px] font-semibold text-sky-600 transition hover:bg-sky-50 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              รีเฟรช
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <LoaderCircle size={34} className="animate-spin text-sky-400" />
              <p className="text-[16px] text-slate-500">กำลังโหลดข้อมูลนัดหมาย...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-sky-100 to-pink-100 text-sky-500">
                <CalendarDays size={38} />
              </div>

              <h3 className="text-[19px] font-bold text-slate-700" style={fontHead}>
                ยังไม่มีนัดหมาย
              </h3>

              <p className="mx-auto mt-2 max-w-xs text-[16px] leading-relaxed text-slate-500">
                หากพยาบาลสร้างนัดหมายให้คุณ
                รายการจะแสดงที่หน้านี้
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const status = getStatus(appointment.status);
                const StatusIcon = status.icon;

                return (
                  <article
                    key={appointment.id}
                    className="relative overflow-hidden rounded-3xl border-2 border-slate-100 bg-[#FFFDFB] p-5 pl-6 transition hover:border-sky-200"
                  >
                    <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${status.bar}`} />

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[19px] font-bold leading-snug text-slate-800" style={fontHead}>
                          {appointment.title || "นัดหมายจากพยาบาล"}
                        </h3>

                        <p className="mt-1 flex items-center gap-1 text-[14px] text-slate-400">
                          <Hash size={14} />
                          หมายเลขนัดหมาย #{appointment.id}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-semibold ${status.style}`}
                      >
                        <StatusIcon size={16} />
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-2xl bg-sky-50 p-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-sky-500">
                          <CalendarDays size={22} />
                        </span>
                        <div>
                          <p className="text-[14px] text-sky-700">วันที่นัดหมาย</p>
                          <p className="text-[17px] font-bold text-slate-800">
                            {formatDate(appointment.appointment_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-pink-50 p-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-pink-500">
                          <Clock size={22} />
                        </span>
                        <div>
                          <p className="text-[14px] text-pink-700">เวลานัดหมาย</p>
                          <p className="text-[17px] font-bold text-slate-800">
                            {formatTime(appointment.appointment_time)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {appointment.description && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="flex items-center gap-1.5 text-[15px] font-semibold text-slate-700">
                          <FileText size={17} className="text-slate-400" />
                          รายละเอียดการนัดหมาย
                        </p>

                        <p className="mt-1.5 whitespace-pre-wrap text-[16px] leading-relaxed text-slate-600">
                          {appointment.description}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="py-6 text-center text-[14px] text-slate-400">
          ระบบดูแลสุขภาพแม่และเด็ก
        </footer>
      </div>
    </main>
  );
}