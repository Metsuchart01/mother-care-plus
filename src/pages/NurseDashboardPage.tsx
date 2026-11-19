import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Baby as BabyIcon,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock,
  Droplet,
  Eye,
  EyeOff,
  FileText,
  HeartPulse,
  Image as ImageIcon,
  LoaderCircle,
  LogOut,
  Milk,
  Phone,
  PlayCircle,
  Plus,
  Search,
  Stethoscope,
  Tag,
  Timer,
  Trash2,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type Mother = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type Baby = {
  id: number;
  mother_id: string;
  baby_name: string;
  birth_date: string;
  sex: string | null;
};

type Assessment = {
  id: number;
  mother_id: string;
  assessment_date: string;
  pain_score: number | null;
  triage_level: string | null;
  notes: string | null;
  fever: boolean | null;
  heavy_bleeding: boolean | null;
  breast_pain: boolean | null;
  mood_status: string | null;
};

type FeedingLog = {
  id: number;
  mother_id: string;
  baby_id: number;
  record_type: string;
  feeding_side: string | null;
  started_at: string;
  duration_minutes: number | null;
  amount_ml: number | null;
  notes: string | null;
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
};

type Article = {
  id: number;
  title: string;
  category: string;
  summary: string | null;
  content: string;
  cover_image: string | null;
  reading_minutes: number | null;
  published: boolean | null;
  youtube_url: string | null;
};

type Tab = "mothers" | "appointments" | "articles";

/* ---------- ตัวช่วยด้านการแสดงผล (UI เท่านั้น) ---------- */
const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" };
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" };

const triageDisplay: Record<string, { label: string; style: string; bar: string }> = {
  red: { label: "พบสัญญาณอันตราย", style: "bg-rose-100 text-rose-700", bar: "bg-rose-400" },
  yellow: { label: "ควรเฝ้าระวัง", style: "bg-amber-100 text-amber-700", bar: "bg-amber-300" },
  green: { label: "ความเสี่ยงต่ำ", style: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-300" },
};

const statusDisplay: Record<string, { label: string; style: string }> = {
  scheduled: { label: "รอเข้ารับบริการ", style: "bg-sky-100 text-sky-700" },
  completed: { label: "เข้ารับบริการแล้ว", style: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "ยกเลิกนัดหมาย", style: "bg-rose-100 text-rose-700" },
};

const recordTypeLabel: Record<string, string> = {
  nursing: "ให้นมจากเต้า",
  pumping: "ปั๊มนม",
};

const sideLabel: Record<string, string> = {
  left: "ซ้าย",
  right: "ขวา",
  both: "สองข้าง",
};

function Field({
  label,
  icon,
  className = "",
  children,
}: {
  label: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 flex items-center gap-2 text-[16px] font-semibold text-slate-700">
        {icon && <span className="text-sky-400">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoChip({ children, tone = "bg-slate-50 text-slate-600" }: { children: ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[14px] ${tone}`}>
      {children}
    </span>
  );
}

function YesNo({ label, value }: { label: string; value: boolean | null }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[14px] ${
        value ? "bg-rose-50 font-semibold text-rose-700" : "bg-slate-50 text-slate-500"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${value ? "bg-rose-400" : "bg-slate-300"}`} />
      {label}: {value ? "มี" : "ไม่มี"}
    </span>
  );
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm md:p-7">
      {children}
    </section>
  );
}

function SectionTitle({ icon, children, right }: { icon: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-3 text-[20px] font-bold text-slate-800" style={fontHead}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-500">{icon}</span>
        {children}
      </h2>
      {right}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-100 py-8 text-center">
      <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full bg-sky-50 text-sky-300">{icon}</div>
      <p className="text-[16px] text-slate-400">{text}</p>
    </div>
  );
}

export default function NurseDashboardPage() {
  const [tab, setTab] = useState<Tab>("mothers");

  const [mothers, setMothers] = useState<Mother[]>([]);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  const [selectedMother, setSelectedMother] =
    useState<Mother | null>(null);

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [feedingLogs, setFeedingLogs] =
    useState<FeedingLog[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [appointmentForm, setAppointmentForm] = useState({
    mother_id: "",
    title: "",
    description: "",
    appointment_date: "",
    appointment_time: "",
  });

  const [articleForm, setArticleForm] = useState({
    title: "",
    category: "",
    summary: "",
    content: "",
    cover_image: "",
    reading_minutes: 5,
    youtube_url: "",
    published: true,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  // โหลดข้อมูล Dashboard
  const loadDashboard = async () => {
    setLoading(true);
    setMessage("");

    try {
      const [
        motherResult,
        babyResult,
        appointmentResult,
        articleResult,
        roleResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone")
          .order("full_name"),

        supabase
          .from("baby_profiles")
          .select("*"),

        supabase
          .from("appointments")
          .select("*")
          .order("appointment_date", { ascending: true }),

        supabase
          .from("knowledge_articles")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "mother"),
      ]);

      if (motherResult.error) throw motherResult.error;
      if (babyResult.error) throw babyResult.error;
      if (appointmentResult.error) throw appointmentResult.error;
      if (articleResult.error) throw articleResult.error;
      if (roleResult.error) throw roleResult.error;

      const motherIds = new Set(
        (roleResult.data || []).map((r) => r.user_id)
      );

      setMothers(
        (motherResult.data || []).filter((m) =>
          motherIds.has(m.id)
        )
      );

      setBabies(babyResult.data || []);
      setAppointments(appointmentResult.data || []);
      setArticles(articleResult.data || []);

    } catch (error: any) {
      console.error("Dashboard error:", error);
      setMessage(error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // โหลดประวัติคุณแม่
  const loadMotherHistory = async (mother: Mother) => {
    setSelectedMother(mother);
    setLoading(true);
    setMessage("");

    try {
      const [assessmentResult, feedingResult] =
        await Promise.all([
          supabase
            .from("postpartum_assessments")
            .select("*")
            .eq("mother_id", mother.id)
            .order("assessment_date", { ascending: false }),

          supabase
            .from("feeding_logs")
            .select("*")
            .eq("mother_id", mother.id)
            .order("started_at", { ascending: false }),
        ]);

      if (assessmentResult.error) throw assessmentResult.error;
      if (feedingResult.error) throw feedingResult.error;

      setAssessments(assessmentResult.data || []);
      setFeedingLogs(feedingResult.data || []);

    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "โหลดประวัติไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มนัดหมาย
  const handleAddAppointment = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !appointmentForm.mother_id ||
      !appointmentForm.title.trim() ||
      !appointmentForm.appointment_date ||
      !appointmentForm.appointment_time
    ) {
      alert("กรุณากรอกข้อมูลนัดหมายให้ครบ");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("กรุณาเข้าสู่ระบบ");

      const { error } = await supabase
        .from("appointments")
        .insert({
          mother_id: appointmentForm.mother_id,
          nurse_id: user.id,
          title: appointmentForm.title.trim(),
          description: appointmentForm.description.trim() || null,
          appointment_date: appointmentForm.appointment_date,
          appointment_time: appointmentForm.appointment_time,
          status: "scheduled",
        });

      if (error) throw error;

      alert("เพิ่มนัดหมายเรียบร้อยแล้ว");

      setAppointmentForm({
        mother_id: "",
        title: "",
        description: "",
        appointment_date: "",
        appointment_time: "",
      });

      await loadDashboard();

    } catch (error: any) {
      console.error(error);
      alert("เพิ่มนัดหมายไม่สำเร็จ: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ลบนัดหมาย
  const handleDeleteAppointment = async (id: number) => {
    const confirmed = window.confirm(
      "ยืนยันว่าต้องการลบนัดหมายนี้หรือไม่?"
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      alert("ลบนัดหมายเรียบร้อยแล้ว");

      await loadDashboard();
    } catch (error: any) {
      alert("ลบนัดหมายไม่สำเร็จ: " + error.message);
    }
  };

  // เพิ่มบทความใหม่
  const handleAddArticle = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !articleForm.title.trim() ||
      !articleForm.category.trim() ||
      !articleForm.content.trim()
    ) {
      alert("กรุณากรอกชื่อ หมวดหมู่ และเนื้อหาบทความ");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("knowledge_articles")
        .insert({
          title: articleForm.title.trim(),
          category: articleForm.category.trim(),
          summary: articleForm.summary.trim() || null,
          content: articleForm.content.trim(),
          cover_image: articleForm.cover_image.trim() || null,
          reading_minutes: articleForm.reading_minutes,
          youtube_url: articleForm.youtube_url.trim() || null,
          published: articleForm.published,
        });

      if (error) throw error;

      alert("เพิ่มบทความเรียบร้อยแล้ว");

      setArticleForm({
        title: "",
        category: "",
        summary: "",
        content: "",
        cover_image: "",
        reading_minutes: 5,
        youtube_url: "",
        published: true,
      });

      await loadDashboard();

    } catch (error: any) {
      console.error(error);
      alert("เพิ่มบทความไม่สำเร็จ: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ลบบทความ
  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm("ยืนยันลบบทความนี้หรือไม่?")) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("knowledge_articles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      alert("ลบบทความเรียบร้อยแล้ว");
      await loadDashboard();

    } catch (error: any) {
      console.error(error);
      alert("ลบบทความไม่สำเร็จ: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (!window.confirm("ต้องการออกจากระบบหรือไม่?")) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("ออกจากระบบไม่สำเร็จ: " + error.message);
    }
  };

  // ค้นหาคุณแม่
  const filteredMothers = useMemo(() => {
    return mothers.filter((mother) => {
      const name = mother.full_name || "";
      const phone = mother.phone || "";

      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        phone.includes(search)
      );
    });
  }, [mothers, search]);

  const motherName = (id: string | null) => {
    return (
      mothers.find((m) => m.id === id)?.full_name ||
      "ไม่ระบุชื่อ"
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("th-TH");
  };

  const inputClass =
    "w-full min-h-[56px] rounded-2xl border-2 border-sky-100 bg-[#FBFDFF] px-4 py-3 text-[17px] text-slate-800 " +
    "placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100";

  const primaryButton =
    "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400 " +
    "text-[18px] font-bold text-white shadow-[0_10px_25px_-8px_rgba(14,165,233,0.6)] transition hover:brightness-105 " +
    "active:scale-[0.98] disabled:opacity-60";

  const deleteButton =
    "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 text-[16px] font-semibold text-rose-600 " +
    "transition hover:bg-rose-100 active:scale-[0.97] disabled:opacity-50";

  const tabs: { id: Tab; label: string; icon: typeof Users; count: number }[] = [
    { id: "mothers", label: "รายชื่อคุณแม่", icon: Users, count: mothers.length },
    { id: "appointments", label: "จัดการนัดหมาย", icon: CalendarDays, count: appointments.length },
    { id: "articles", label: "ความรู้หลังคลอด", icon: BookOpen, count: articles.length },
  ];

  const selectedBabies = selectedMother
    ? babies.filter((b) => b.mother_id === selectedMother.id)
    : [];

  return (
    <main className="min-h-screen bg-[#F7FAFC] pb-12 text-slate-700" style={fontBody}>
      {/* ---------- HEADER ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-sky-200 via-cyan-100 to-pink-100 px-4 pt-7 pb-16 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-16 -right-10 h-52 w-52 rounded-full bg-white/40 blur-2xl" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-sky-500 shadow-sm">
                <Stethoscope size={28} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-sky-700">ระบบจัดการสำหรับพยาบาล</p>
                <h1 className="text-[26px] font-bold leading-tight text-slate-800" style={fontHead}>
                  Nurse Dashboard
                </h1>
                <p className="hidden text-[15px] text-slate-600 sm:block">
                  ระบบดูแลคุณแม่และติดตามสุขภาพหลังคลอด
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="ออกจากระบบ"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-white/70 px-4 text-[15px] font-semibold text-rose-600 shadow-sm transition hover:bg-white active:scale-95"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 -mt-10 space-y-5">
        {/* ---------- สรุป + เมนู ---------- */}
        <nav className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTab(item.id)}
                className={`rounded-3xl border-2 p-3 text-left shadow-sm transition active:scale-[0.97] sm:p-5 ${
                  active
                    ? "border-sky-300 bg-white shadow-[0_16px_40px_-20px_rgba(14,165,233,0.5)]"
                    : "border-transparent bg-white/90 hover:border-sky-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl sm:h-12 sm:w-12 ${
                      active ? "bg-sky-500 text-white" : "bg-sky-50 text-sky-500"
                    }`}
                  >
                    <Icon size={22} />
                  </span>
                  <span className="text-[24px] font-bold text-slate-800 sm:text-[30px]" style={fontHead}>
                    {item.count}
                  </span>
                </div>
                <p
                  className={`mt-2 text-[14px] font-semibold leading-snug sm:text-[16px] ${
                    active ? "text-sky-700" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </p>
              </button>
            );
          })}
        </nav>

        {message && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-[15px] text-red-700"
          >
            <AlertCircle size={22} className="shrink-0" />
            <span className="flex-1">{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="ปิด"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-red-500 transition hover:bg-red-100"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-[16px] text-slate-500">
            <LoaderCircle size={22} className="animate-spin text-sky-400" />
            กำลังโหลดข้อมูล...
          </div>
        )}

        {/* ---------- MOTHERS ---------- */}
        {tab === "mothers" && (
          <SectionCard>
            {!selectedMother ? (
              <>
                <SectionTitle icon={<Users size={20} />}>รายชื่อคุณแม่</SectionTitle>

                <div className="relative mb-5">
                  <Search size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" />
                  <input
                    className={inputClass + " pl-12"}
                    placeholder="ค้นหาชื่อหรือเบอร์โทรศัพท์..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredMothers.map((mother) => {
                    const babyCount = babies.filter((b) => b.mother_id === mother.id).length;
                    return (
                      <button
                        key={mother.id}
                        type="button"
                        onClick={() => loadMotherHistory(mother)}
                        className="group flex items-center gap-4 rounded-3xl border-2 border-slate-100 bg-[#FFFDFB] p-4 text-left transition hover:border-sky-200 hover:shadow-sm active:scale-[0.98]"
                      >
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-100 to-sky-100 text-pink-500">
                          <UserIcon size={26} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[18px] font-bold text-slate-800" style={fontHead}>
                            {mother.full_name || "ไม่ระบุชื่อ"}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[15px] text-slate-500">
                            <Phone size={14} />
                            โทร: {mother.phone || "-"}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-slate-500">
                            <BabyIcon size={14} />
                            ลูก {babyCount} คน
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-0.5 text-[14px] font-semibold text-sky-600">
                          ดูประวัติ
                          <ChevronRight size={18} className="transition group-hover:translate-x-0.5" />
                        </span>
                      </button>
                    );
                  })}

                  {filteredMothers.length === 0 && (
                    <EmptyState icon={<Users size={26} />} text="ไม่พบรายชื่อคุณแม่" />
                  )}
                </div>
              </>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMother(null);
                    setAssessments([]);
                    setFeedingLogs([]);
                  }}
                  className="mb-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-sky-50 px-4 text-[16px] font-semibold text-sky-700 transition hover:bg-sky-100 active:scale-95"
                >
                  <ArrowLeft size={20} />
                  กลับไปรายชื่อคุณแม่
                </button>

                {/* ข้อมูลคุณแม่ */}
                <div className="mb-7 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-pink-50 to-sky-50 p-5">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white text-pink-500 shadow-sm">
                    <UserIcon size={30} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[24px] font-bold leading-tight text-slate-800" style={fontHead}>
                      {selectedMother.full_name || "ไม่ระบุชื่อ"}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-[16px] text-slate-600">
                      <Phone size={16} />
                      โทร: {selectedMother.phone || "-"}
                    </p>
                  </div>
                </div>

                {/* ข้อมูลลูก */}
                <h3 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-slate-800" style={fontHead}>
                  <BabyIcon size={20} className="text-sky-400" />
                  ข้อมูลลูก
                </h3>

                <div className="mb-8 grid gap-3 md:grid-cols-2">
                  {selectedBabies.map((baby) => (
                    <div key={baby.id} className="flex items-center gap-4 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-sky-500">
                        <BabyIcon size={24} />
                      </span>
                      <div>
                        <p className="text-[17px] font-bold text-slate-800">{baby.baby_name}</p>
                        <p className="text-[15px] text-slate-600">วันเกิด: {formatDate(baby.birth_date)}</p>
                        <p className="text-[15px] text-slate-600">เพศ: {baby.sex || "-"}</p>
                      </div>
                    </div>
                  ))}
                  {selectedBabies.length === 0 && (
                    <EmptyState icon={<BabyIcon size={26} />} text="ยังไม่มีข้อมูลลูก" />
                  )}
                </div>

                {/* ประวัติประเมิน */}
                <h3 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-slate-800" style={fontHead}>
                  <HeartPulse size={20} className="text-pink-400" />
                  ประวัติการประเมินหลังคลอด
                  <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-[13px] font-semibold text-pink-600">
                    {assessments.length}
                  </span>
                </h3>

                <div className="mb-8 space-y-3">
                  {assessments.map((a) => {
                    const tri = a.triage_level ? triageDisplay[a.triage_level] : undefined;
                    return (
                      <div key={a.id} className="relative overflow-hidden rounded-2xl border-2 border-slate-100 bg-[#FFFDFB] p-4 pl-5">
                        <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${tri?.bar ?? "bg-slate-200"}`} />
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="flex items-center gap-1.5 text-[16px] font-semibold text-slate-800">
                            <CalendarDays size={16} className="text-pink-400" />
                            {formatDateTime(a.assessment_date)}
                          </p>
                          <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${tri?.style ?? "bg-slate-100 text-slate-600"}`}>
                            ระดับการประเมิน: {tri ? tri.label : a.triage_level || "-"}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <InfoChip tone="bg-pink-50 text-pink-700">คะแนนความปวด: {a.pain_score ?? "-"}</InfoChip>
                          <YesNo label="มีไข้" value={a.fever} />
                          <YesNo label="เลือดออกมาก" value={a.heavy_bleeding} />
                          <YesNo label="ปวดเต้านม" value={a.breast_pain} />
                          <InfoChip>อารมณ์: {a.mood_status || "-"}</InfoChip>
                        </div>
                        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[15px] text-slate-600">
                          บันทึก: {a.notes || "-"}
                        </p>
                      </div>
                    );
                  })}

                  {assessments.length === 0 && (
                    <EmptyState icon={<HeartPulse size={26} />} text="ยังไม่มีประวัติการประเมิน" />
                  )}
                </div>

                {/* ประวัติให้นม */}
                <h3 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-slate-800" style={fontHead}>
                  <Milk size={20} className="text-violet-400" />
                  ประวัติการให้นม
                  <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[13px] font-semibold text-violet-600">
                    {feedingLogs.length}
                  </span>
                </h3>

                <div className="space-y-3">
                  {feedingLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl border-2 border-slate-100 bg-[#FFFDFB] p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-500">
                          <Milk size={22} />
                        </span>
                        <div>
                          <p className="text-[16px] font-bold text-slate-800">
                            ประเภท: {recordTypeLabel[log.record_type] ?? log.record_type}
                          </p>
                          <p className="text-[14px] text-slate-500">{formatDateTime(log.started_at)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <InfoChip tone="bg-pink-50 text-pink-700">
                          ข้างที่ให้นม: {log.feeding_side ? sideLabel[log.feeding_side] ?? log.feeding_side : "-"}
                        </InfoChip>
                        <InfoChip tone="bg-amber-50 text-amber-700">
                          <Timer size={15} />
                          {log.duration_minutes ?? "-"} นาที
                        </InfoChip>
                        <InfoChip tone="bg-sky-50 text-sky-700">
                          <Droplet size={15} />
                          {log.amount_ml ?? "-"} ml
                        </InfoChip>
                      </div>
                      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[15px] text-slate-600">
                        บันทึก: {log.notes || "-"}
                      </p>
                    </div>
                  ))}

                  {feedingLogs.length === 0 && (
                    <EmptyState icon={<Milk size={26} />} text="ยังไม่มีประวัติการให้นม" />
                  )}
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {/* ---------- APPOINTMENTS ---------- */}
        {tab === "appointments" && (
          <>
            <SectionCard>
              <SectionTitle icon={<CalendarPlus size={20} />}>เพิ่มนัดหมายคุณแม่</SectionTitle>

              <form onSubmit={handleAddAppointment} className="grid gap-4 md:grid-cols-2">
                <Field label="เลือกคุณแม่" icon={<UserIcon size={18} />}>
                  <select
                    required
                    className={inputClass}
                    value={appointmentForm.mother_id}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        mother_id: e.target.value,
                      })
                    }
                  >
                    <option value="">-- เลือกคุณแม่ --</option>
                    {mothers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name || m.id}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="หัวข้อนัดหมาย" icon={<FileText size={18} />}>
                  <input
                    required
                    className={inputClass}
                    placeholder="เช่น ตรวจแผลหลังคลอด"
                    value={appointmentForm.title}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        title: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="วันที่นัด" icon={<CalendarDays size={18} />}>
                  <input
                    required
                    type="date"
                    className={inputClass}
                    value={appointmentForm.appointment_date}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        appointment_date: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="เวลานัด" icon={<Clock size={18} />}>
                  <input
                    required
                    type="time"
                    className={inputClass}
                    value={appointmentForm.appointment_time}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        appointment_time: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="รายละเอียด" icon={<FileText size={18} />} className="md:col-span-2">
                  <textarea
                    className={inputClass + " leading-relaxed"}
                    rows={3}
                    value={appointmentForm.description}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        description: e.target.value,
                      })
                    }
                  />
                </Field>

                <button type="submit" disabled={saving} className={primaryButton + " md:col-span-2"} style={fontHead}>
                  {saving ? <LoaderCircle size={20} className="animate-spin" /> : <Plus size={20} />}
                  {saving ? "กำลังบันทึก..." : "เพิ่มนัดหมาย"}
                </button>
              </form>
            </SectionCard>

            <SectionCard>
              <SectionTitle
                icon={<CalendarDays size={20} />}
                right={
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-[13px] font-semibold text-sky-600">
                    {appointments.length} รายการ
                  </span>
                }
              >
                รายการนัดหมายทั้งหมด
              </SectionTitle>

              <div className="grid gap-3 lg:grid-cols-2">
                {appointments.map((a) => {
                  const st = a.status ? statusDisplay[a.status] : undefined;
                  return (
                    <div key={a.id} className="flex flex-col rounded-3xl border-2 border-slate-100 bg-[#FFFDFB] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[18px] font-bold text-slate-800" style={fontHead}>
                          {a.title || "นัดหมาย"}
                        </p>
                        <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${st?.style ?? "bg-slate-100 text-slate-600"}`}>
                          สถานะ: {st ? st.label : a.status || "-"}
                        </span>
                      </div>

                      <p className="mt-2 flex items-center gap-1.5 text-[16px] text-slate-700">
                        <UserIcon size={16} className="text-pink-400" />
                        คุณแม่: <span className="font-semibold">{motherName(a.mother_id)}</span>
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <InfoChip tone="bg-sky-50 text-sky-700">
                          <CalendarDays size={15} />
                          {formatDate(a.appointment_date)}
                        </InfoChip>
                        <InfoChip tone="bg-pink-50 text-pink-700">
                          <Clock size={15} />
                          {a.appointment_time || "-"}
                        </InfoChip>
                      </div>

                      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[15px] text-slate-600">
                        รายละเอียด: {a.description || "-"}
                      </p>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleDeleteAppointment(a.id)}
                        className={deleteButton + " mt-4 self-start"}
                      >
                        <Trash2 size={18} />
                        ลบนัดหมาย
                      </button>
                    </div>
                  );
                })}

                {appointments.length === 0 && (
                  <EmptyState icon={<CalendarDays size={26} />} text="ยังไม่มีนัดหมาย" />
                )}
              </div>
            </SectionCard>
          </>
        )}

        {/* ---------- ARTICLES ---------- */}
        {tab === "articles" && (
          <>
            <SectionCard>
              <SectionTitle icon={<BookOpen size={20} />}>จัดการความรู้หลังคลอด</SectionTitle>

              <form onSubmit={handleAddArticle} className="grid gap-4 md:grid-cols-2">
                <Field label="ชื่อบทความ" icon={<FileText size={18} />}>
                  <input
                    required
                    className={inputClass}
                    value={articleForm.title}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        title: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="หมวดหมู่" icon={<Tag size={18} />}>
                  <input
                    required
                    className={inputClass}
                    placeholder="เช่น การให้นมแม่"
                    value={articleForm.category}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        category: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="สรุปบทความ" className="md:col-span-2">
                  <textarea
                    className={inputClass + " leading-relaxed"}
                    rows={2}
                    value={articleForm.summary}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        summary: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="เนื้อหาบทความ" className="md:col-span-2">
                  <textarea
                    required
                    className={inputClass + " leading-relaxed"}
                    rows={7}
                    value={articleForm.content}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        content: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="URL รูปหน้าปก" icon={<ImageIcon size={18} />}>
                  <input
                    className={inputClass}
                    value={articleForm.cover_image}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        cover_image: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="URL YouTube" icon={<PlayCircle size={18} />}>
                  <input
                    className={inputClass}
                    value={articleForm.youtube_url}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        youtube_url: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="เวลาอ่าน (นาที)" icon={<Clock size={18} />}>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    className={inputClass}
                    value={articleForm.reading_minutes}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        reading_minutes: Math.max(1, Number(e.target.value)),
                      })
                    }
                  />
                </Field>

                <div className="flex items-end">
                  <label
                    className={`flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 px-4 transition ${
                      articleForm.published ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[16px] font-semibold text-slate-700">
                      {articleForm.published ? (
                        <Eye size={20} className="text-emerald-500" />
                      ) : (
                        <EyeOff size={20} className="text-slate-400" />
                      )}
                      เผยแพร่ทันที
                    </span>
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={articleForm.published}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          published: e.target.checked,
                        })
                      }
                    />
                    <span
                      aria-hidden="true"
                      className={`relative h-8 w-14 shrink-0 rounded-full transition peer-focus-visible:ring-4 peer-focus-visible:ring-sky-100 ${
                        articleForm.published ? "bg-emerald-400" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                          articleForm.published ? "translate-x-6" : ""
                        }`}
                      />
                    </span>
                  </label>
                </div>

                <button type="submit" disabled={saving} className={primaryButton + " md:col-span-2"} style={fontHead}>
                  {saving ? <LoaderCircle size={20} className="animate-spin" /> : <Plus size={20} />}
                  {saving ? "กำลังบันทึก..." : "เพิ่มบทความ"}
                </button>
              </form>
            </SectionCard>

            <SectionCard>
              <SectionTitle
                icon={<BookOpen size={20} />}
                right={
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-[13px] font-semibold text-sky-600">
                    {articles.length} บทความ
                  </span>
                }
              >
                บทความทั้งหมด
              </SectionTitle>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {articles.map((article) => (
                  <div key={article.id} className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-100 bg-[#FFFDFB]">
                    {article.cover_image ? (
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-sky-100 via-pink-50 to-orange-50">
                        <BookOpen size={36} className="text-sky-300" />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-[13px] font-semibold text-pink-600">
                          <Tag size={13} />
                          {article.category}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-semibold ${
                            article.published
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {article.published ? <Eye size={13} /> : <EyeOff size={13} />}
                          {article.published ? "เผยแพร่แล้ว" : "ซ่อนอยู่"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-[18px] font-bold leading-snug text-slate-800" style={fontHead}>
                        {article.title}
                      </h3>

                      <p className="my-2 line-clamp-3 flex-1 text-[15px] leading-relaxed text-slate-600">
                        {article.summary || ""}
                      </p>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleDeleteArticle(article.id)}
                        className={deleteButton + " mt-3 w-full"}
                      >
                        <Trash2 size={18} />
                        ลบบทความ
                      </button>
                    </div>
                  </div>
                ))}

                {articles.length === 0 && (
                  <EmptyState icon={<BookOpen size={26} />} text="ยังไม่มีบทความ" />
                )}
              </div>
            </SectionCard>
          </>
        )}

        <footer className="py-6 text-center text-[14px] text-slate-400">
          ระบบดูแลสุขภาพแม่และเด็ก
        </footer>
      </div>
    </main>
  );
}