import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  Activity,
  Baby,
  BookOpen,
  CalendarDays,
  Heart,
  HeartHandshake,
  LogOut,
  Milk,
  ClipboardList,
  ChevronRight,
  LoaderCircle,
  Phone,
  Siren,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type DashboardPageProps = {
  user: User
  onOpenProfile: () => void
  onOpenFeeding: () => void
  onOpenAssessment: () => void
  onOpenKnowledge: () => void
  onOpenHistory: () => void
  onOpenAppointments: () => void
  onOpenMessages: () => void
}

type Profile = {
  full_name: string | null
}

const menuItems = [
  {
    title: 'ประเมินสุขภาพคุณแม่',
    description: 'บันทึกอาการและติดตามสุขภาพหลังคลอด',
    icon: Activity,
    color: 'bg-pink-100 text-pink-500',
    ring: 'hover:border-pink-200',
    onClick: 'assessment',
  },
  {
    title: 'ข้อมูลลูกน้อย',
    description: 'ติดตามน้ำหนักและพัฒนาการของลูก',
    icon: Baby,
    color: 'bg-sky-100 text-sky-500',
    ring: 'hover:border-sky-200',
    onClick: 'profile',
  },
  {
    title: 'ความรู้หลังคลอด',
    description: 'เรียนรู้การดูแลตัวเองหลังคลอด',
    icon: BookOpen,
    color: 'bg-orange-100 text-orange-500',
    ring: 'hover:border-orange-200',
    onClick: 'knowledge',
  },
  {
    title: 'บันทึกการให้นม',
    description: 'เทคนิคการให้นมและการเก็บน้ำนม',
    icon: Milk,
    color: 'bg-violet-100 text-violet-500',
    ring: 'hover:border-violet-200',
    onClick: 'feeding',
  },
  {
    title: 'บันทึกสุขภาพ',
    description: 'ดูประวัติการประเมินและบันทึกต่าง ๆ',
    icon: ClipboardList,
    color: 'bg-teal-100 text-teal-500',
    ring: 'hover:border-teal-200',
    onClick: 'history',
  },
  {
    title: 'นัดหมาย',
    description: 'ติดตามวันนัดและกำหนดการดูแล',
    icon: CalendarDays,
    color: 'bg-amber-100 text-amber-500',
    ring: 'hover:border-amber-200',
    onClick: 'appointments',
  },
]

const headingFont = { fontFamily: "'Prompt', 'Sarabun', sans-serif" }

export default function DashboardPage({
  user,
  onOpenProfile,
  onOpenFeeding,
  onOpenAssessment,
  onOpenKnowledge,
  onOpenHistory,
  onOpenAppointments,
  onOpenMessages,
}: DashboardPageProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        setError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้')
      } else {
        setProfile(data)
      }

      setLoading(false)
    }

    loadProfile()
  }, [user.id])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setError('ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง')
    }
  }

  const displayName = profile?.full_name || user.email || 'คุณแม่'

  const actions: Record<string, () => void> = {
    profile: onOpenProfile,
    feeding: onOpenFeeding,
    assessment: onOpenAssessment,
    knowledge: onOpenKnowledge,
    history: onOpenHistory,
    appointments: onOpenAppointments,
    messages: onOpenMessages,
  }

  return (
    <main
      className="min-h-screen bg-[#FFF8F3] pb-10 text-slate-700"
      style={{ fontFamily: "'Sarabun', 'Prompt', sans-serif" }}
    >
      {/* ---------- ส่วนหัว ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-pink-300 via-pink-200 to-sky-200 px-5 pt-8 pb-16 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-sky-100/60 blur-2xl" />

        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/70 text-pink-500 shadow-sm">
                <Heart size={20} fill="currentColor" />
              </span>
              <p className="text-[15px] font-semibold tracking-wide text-pink-700" style={headingFont}>
                MOTHER CARE <span className="text-sky-600">PLUS</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-white/60 text-pink-600 shadow-sm transition hover:bg-white active:scale-95"
              aria-label="ออกจากระบบ"
              title="ออกจากระบบ"
            >
              <LogOut size={22} />
            </button>
          </div>

          <div className="mt-7">
            <h1 className="text-[28px] font-bold leading-tight text-slate-800" style={headingFont}>
              สวัสดีค่ะ คุณแม่
            </h1>

            {loading ? (
              <p className="mt-2 flex items-center gap-2 text-[16px] text-slate-600">
                <LoaderCircle size={18} className="animate-spin" />
                กำลังโหลดข้อมูล...
              </p>
            ) : (
              <p className="mt-1.5 text-[19px] font-semibold text-pink-700 break-words">
                {displayName}
              </p>
            )}

            <p className="mt-1 text-[15px] text-slate-600">
              ยินดีต้อนรับสู่ระบบดูแลสุขภาพคุณแม่และลูกน้อย
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 -mt-9 relative">
        {/* ---------- การ์ดทักทาย ---------- */}
        <section className="bg-white rounded-3xl border border-pink-100 shadow-[0_16px_40px_-20px_rgba(236,72,153,0.35)] p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 text-pink-500">
              <Heart size={28} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-slate-800" style={headingFont}>
                วันนี้คุณแม่เป็นอย่างไรบ้าง?
              </h2>
              <p className="text-[15px] text-slate-500 mt-0.5 leading-relaxed">
                เริ่มต้นด้วยการดูแลสุขภาพของคุณแม่กันนะคะ
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-[15px] text-red-700"
          >
            {error}
          </div>
        )}

        {/* ---------- เมนูหลัก ---------- */}
        <section className="mt-8">
          <div className="flex items-end justify-between mb-4 px-1">
            <h2 className="text-[20px] font-bold text-slate-800" style={headingFont}>
              เมนูดูแลสุขภาพ
            </h2>
            <span className="text-[13px] text-slate-400">แตะเพื่อเปิดเมนู</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={actions[item.onClick]}
                  className={`group relative flex min-h-[168px] flex-col items-start rounded-3xl border-2 border-transparent bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] ${item.ring}`}
                >
                  <div className={`${item.color} grid h-14 w-14 place-items-center rounded-2xl`}>
                    <Icon size={28} />
                  </div>

                  <h3 className="mt-3 text-[17px] font-bold leading-snug text-slate-800" style={headingFont}>
                    {item.title}
                  </h3>

                  <p className="mt-1 text-[14px] leading-relaxed text-slate-500">
                    {item.description}
                  </p>

                  <ChevronRight
                    size={20}
                    className="absolute right-3 top-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-pink-400"
                  />
                </button>
              )
            })}
          </div>

          {/* ---------- ช่วยเหลือ / เบอร์โทร ---------- */}
          <section className="mt-10 space-y-4">
            <div className="text-center">
              <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-pink-100 text-pink-500">
                <HeartHandshake size={22} />
              </div>
              <h2 className="text-[21px] font-bold text-slate-800" style={headingFont}>
                เราพร้อมดูแลคุณแม่เสมอ
              </h2>
              <p className="text-[15px] text-slate-500 mt-1">
                อย่าลืมดูแลสุขภาพกายและสุขภาพใจของตัวเองนะคะ
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* เบอร์ฉุกเฉิน */}
              <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500 text-white shadow-sm">
                    <Siren size={24} />
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-rose-700" style={headingFont}>
                      การแพทย์ฉุกเฉิน
                    </p>
                    <p className="text-[14px] text-rose-600/80">
                      เจ็บป่วยฉุกเฉิน โทรขอความช่วยเหลือทันที
                    </p>
                  </div>
                </div>

                <a
                  href="tel:1669"
                  className="mt-4 flex h-16 items-center justify-between rounded-2xl bg-rose-500 px-5 text-white shadow-[0_10px_20px_-10px_rgba(244,63,94,0.7)] transition active:scale-[0.98] hover:bg-rose-600"
                >
                  <span className="text-[28px] font-bold tracking-wider" style={headingFont}>
                    1669
                  </span>
                  <span className="flex items-center gap-2 text-[16px] font-semibold">
                    <Phone size={20} />
                    โทรฉุกเฉิน
                  </span>
                </a>
              </div>

              {/* สุขภาพจิต */}
              <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-sky-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-400 text-white shadow-sm">
                    <Heart size={24} />
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-violet-700" style={headingFont}>
                      สายด่วนสุขภาพจิต
                    </p>
                    <p className="text-[14px] text-violet-600/80">
                      เมื่อรู้สึกเครียด เศร้า หรือวิตกกังวล
                    </p>
                  </div>
                </div>

                <a
                  href="tel:1323"
                  className="mt-4 flex h-16 items-center justify-between rounded-2xl bg-violet-400 px-5 text-white shadow-[0_10px_20px_-10px_rgba(139,92,246,0.7)] transition active:scale-[0.98] hover:bg-violet-500"
                >
                  <span className="text-[28px] font-bold tracking-wider" style={headingFont}>
                    1323
                  </span>
                  <span className="flex items-center gap-2 text-[16px] font-semibold">
                    <Phone size={20} />
                    โทรปรึกษา
                  </span>
                </a>
                <p className="mt-2 text-[13px] text-violet-600/80">
                  ให้บริการตลอด 24 ชั่วโมง
                </p>
              </div>
            </div>

            {/* ข้อความให้กำลังใจ */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-100 via-[#FFF1E8] to-sky-100 p-6 text-center">
              <Sparkles size={22} className="mx-auto text-pink-400" />
              <p className="mt-2 text-[19px] font-bold text-pink-700" style={headingFont}>
                คุณแม่ก็สำคัญไม่แพ้ลูกน้อย
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                พักผ่อนให้เพียงพอ รับประทานอาหารที่มีประโยชน์
                และอย่าลังเลที่จะขอความช่วยเหลือเมื่อจำเป็น
                เพราะคุณแม่ที่มีสุขภาพดี คือจุดเริ่มต้นของครอบครัวที่มีความสุข
              </p>
            </div>
          </section>
        </section>

        {/* ---------- หมายเหตุ ---------- */}
        <section className="mt-6 flex items-start gap-3 rounded-2xl bg-white/70 border border-slate-100 p-4">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-sky-400" />
          <div>
            <p className="text-[13px] leading-relaxed text-slate-500">
              ระบบนี้ให้ข้อมูลเพื่อสนับสนุนการดูแลสุขภาพ
              ไม่ใช้แทนการตรวจวินิจฉัยจากบุคลากรทางการแพทย์
            </p>
            <p className="mt-1 text-[13px] text-slate-500">
              หากมีอาการฉุกเฉิน โทร <span className="font-semibold text-rose-500">1669</span>
            </p>
          </div>
        </section>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-12 items-center gap-2 rounded-full border-2 border-pink-100 bg-white px-6 text-[15px] font-semibold text-slate-500 transition hover:border-pink-200 hover:text-pink-600 active:scale-95"
          >
            <LogOut size={18} />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </main>
  )
}