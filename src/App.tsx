import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  ArrowLeft,
  Heart,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { supabase } from './lib/supabase'

import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import NurseDashboardPage from './pages/NurseDashboardPage'
import ProfilePage from './pages/ProfilePage'
import FeedingTrackerPage from './pages/FeedingTrackerPage'
import PostpartumAssessmentPage from './pages/PostpartumAssessmentPage'
import MaternalHealthPage from './pages/MaternalHealthPage'
import KnowledgePage from './pages/KnowledgePage'
import KnowledgeDetailPage from './pages/KnowledgeDetailPage'
import HealthHistoryPage from './pages/HealthHistoryPage'
import MotherAppointmentsPage from './pages/MotherAppointmentsPage'

type Page =
  | 'dashboard'
  | 'profile'
  | 'feeding'
  | 'maternal'
  | 'assessment'
  | 'knowledge'
  | 'knowledge-detail'
  | 'history'
  | 'appointments'
  | 'messages'

type Role = 'mother' | 'nurse' | 'admin'

/* ---------- หน้าจอระบบ (UI เท่านั้น) ---------- */
const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" }
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" }

function PastelBackground({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFF8F3] px-4 py-10 text-slate-700"
      style={fontBody}
    >
      <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  )
}

function FullScreenLoader({ text }: { text: string }) {
  return (
    <PastelBackground>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white shadow-[0_8px_24px_-8px_rgba(236,72,153,0.4)]">
          <Heart size={34} className="text-pink-400" fill="currentColor" />
        </div>
        <p className="text-[15px] font-semibold tracking-wide text-pink-500" style={fontHead}>
          MOTHER CARE <span className="text-sky-500">PLUS</span>
        </p>
        <p className="flex items-center gap-2 text-[17px] text-slate-500">
          <LoaderCircle size={20} className="animate-spin text-pink-400" />
          {text}
        </p>
      </div>
    </PastelBackground>
  )
}

function StatusCard({
  icon,
  iconTone,
  title,
  children,
}: {
  icon: ReactNode
  iconTone: string
  title: string
  children: ReactNode
}) {
  return (
    <PastelBackground>
      <section className="rounded-[28px] border border-pink-100 bg-white/90 p-7 text-center shadow-[0_20px_50px_-20px_rgba(236,72,153,0.35)] backdrop-blur">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${iconTone}`}>{icon}</div>
        <h1 className="mt-4 text-[22px] font-bold text-slate-800" style={fontHead}>
          {title}
        </h1>
        {children}
      </section>
    </PastelBackground>
  )
}

function LogoutButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const { error } = await supabase.auth.signOut({
          scope: 'local',
        })

        if (error) {
          console.error('Logout error:', error.message)
        }
      }}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-bold transition active:scale-[0.98] ${className}`}
      style={fontHead}
    >
      <LogOut size={20} />
      ออกจากระบบ
    </button>
  )
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)

  const [role, setRole] = useState<Role | null>(null)
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleError, setRoleError] = useState('')

  const [currentPage, setCurrentPage] =
    useState<Page>('dashboard')

  const [selectedArticleId, setSelectedArticleId] =
    useState<number | null>(null)

  // ตรวจสอบ Session
  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        setRoleError(
          'ไม่สามารถตรวจสอบบัญชีได้: ' + error.message
        )
      }

      setSession(data.session)
      setChecking(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('AUTH EVENT:', event)
        console.log('SESSION USER:', newSession?.user.id)

        setSession(newSession)

        if (event === 'SIGNED_OUT') {
          setRole(null)
          setRoleError('')
          setCurrentPage('dashboard')
          setSelectedArticleId(null)
        }

        if (event === 'SIGNED_IN') {
          setRole(null)
          setRoleError('')
          setCurrentPage('dashboard')
          setSelectedArticleId(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ตรวจสอบ Role จาก user_roles
  useEffect(() => {
    let active = true

    async function loadRole() {
      if (!session?.user.id) {
        setRole(null)
        setRoleLoading(false)
        return
      }

      setRoleLoading(true)
      setRole(null)
      setRoleError('')

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!active) return

      console.log('===== ROLE DEBUG =====')
      console.log('User ID:', session.user.id)
      console.log('Role Data:', data)
      console.log('Role Error:', error)
      console.log('======================')

      if (error) {
        setRoleError(
          'ไม่สามารถตรวจสอบสิทธิ์ได้: ' + error.message
        )
        setRoleLoading(false)
        return
      }

      if (!data) {
        setRoleError(
          'บัญชีนี้ยังไม่ได้รับการกำหนดสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ'
        )
        setRoleLoading(false)
        return
      }

      const userRole = data.role as Role

      if (
        userRole !== 'mother' &&
        userRole !== 'nurse' &&
        userRole !== 'admin'
      ) {
        setRoleError(
          'ไม่พบประเภทบัญชีที่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ'
        )
        setRoleLoading(false)
        return
      }

      setRole(userRole)
      setRoleLoading(false)
    }

    void loadRole()

    return () => {
      active = false
    }
  }, [session?.user.id])

  // ตรวจสอบ State
  useEffect(() => {
    console.log('ROLE UPDATED:', role)
    console.log('PAGE UPDATED:', currentPage)
  }, [role, currentPage])

  // Loading Session
  if (checking) {
    return <FullScreenLoader text="กำลังตรวจสอบบัญชี..." />
  }

  // ยังไม่ได้ Login
  if (!session) {
    return <AuthPage />
  }

  // กำลังตรวจสอบ Role
  if (roleLoading) {
    return <FullScreenLoader text="กำลังตรวจสอบสิทธิ์ผู้ใช้งาน..." />
  }

  // พบข้อผิดพลาดในการตรวจสอบ Role
  if (roleError || !role) {
    return (
      <StatusCard
        icon={<LockKeyhole size={30} />}
        iconTone="bg-rose-50 text-rose-400"
        title="ไม่สามารถเข้าใช้งานได้"
      >
        <p
          role="alert"
          className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-[16px] leading-relaxed text-rose-700"
        >
          {roleError || 'ไม่พบข้อมูลสิทธิ์ผู้ใช้งาน'}
        </p>

        <LogoutButton className="mt-6 bg-gradient-to-r from-sky-400 to-sky-500 text-white shadow-[0_10px_25px_-8px_rgba(14,165,233,0.6)] hover:brightness-105" />
      </StatusCard>
    )
  }

  const user: User = session.user

  // =====================================
  // ส่วนของพยาบาล
  // =====================================

  if (role === 'nurse') {
    return <NurseDashboardPage />
  }

  // =====================================
  // ส่วนของ Admin
  // =====================================

  if (role === 'admin') {
    return (
      <StatusCard
        icon={<ShieldCheck size={30} />}
        iconTone="bg-sky-50 text-sky-500"
        title="ระบบผู้ดูแลระบบ"
      >
        <p className="mt-2 text-[16px] text-slate-500">
          บัญชี Admin ตรวจสอบสิทธิ์สำเร็จแล้ว
        </p>

        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-[15px] font-semibold text-amber-700">
          <Wrench size={16} />
          หน้าจัดการ Admin กำลังพัฒนา
        </p>

        <LogoutButton className="mt-6 border-2 border-slate-200 bg-white text-slate-600 hover:bg-slate-50" />
      </StatusCard>
    )
  }

  // =====================================
  // ส่วนของคุณแม่
  // =====================================

  if (currentPage === 'profile') {
    return (
      <ProfilePage
        user={user}
        onBack={() => setCurrentPage('dashboard')}
      />
    )
  }

  if (currentPage === 'feeding') {
    return (
      <FeedingTrackerPage
        user={user}
        onBack={() => setCurrentPage('dashboard')}
      />
    )
  }

  if (currentPage === 'maternal') {
    return (
      <MaternalHealthPage
        user={user}
        onBack={() => setCurrentPage('dashboard')}
      />
    )
  }

  if (currentPage === 'assessment') {
    return (
      <PostpartumAssessmentPage
        user={user}
        onBack={() => setCurrentPage('dashboard')}
      />
    )
  }

  if (currentPage === 'knowledge') {
    return (
      <KnowledgePage
        user={user}
        onBack={() => setCurrentPage('dashboard')}
        onOpenArticle={(id) => {
          setSelectedArticleId(id)
          setCurrentPage('knowledge-detail')
        }}
      />
    )
  }

  if (
    currentPage === 'knowledge-detail' &&
    selectedArticleId !== null
  ) {
    return (
      <KnowledgeDetailPage
        user={user}
        articleId={selectedArticleId}
        onBack={() => setCurrentPage('knowledge')}
      />
    )
  }

  if (currentPage === 'history') {
    return (
      <HealthHistoryPage
        user={user}
        onBack={() => setCurrentPage('dashboard')}
      />
    )
  }

  // =====================================
  // หน้านัดหมายของคุณแม่
  // =====================================

  if (currentPage === 'appointments') {
    return (
      <MotherAppointmentsPage
        user={user}
        onBack={() => setCurrentPage('dashboard')}
      />
    )
  }

  // =====================================
  // หน้าติดต่อพยาบาล
  // =====================================

  if (currentPage === 'messages') {
    return (
      <main className="min-h-screen bg-[#FFF8F3] pb-12 text-slate-700" style={fontBody}>
        <header className="relative overflow-hidden bg-gradient-to-br from-pink-200 via-pink-100 to-sky-100 px-4 pt-6 pb-14 rounded-b-[2.5rem]">
          <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
          <div className="relative max-w-3xl mx-auto">
            <button
              type="button"
              onClick={() => setCurrentPage('dashboard')}
              className="mb-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-white/70 px-4 text-[16px] font-semibold text-pink-700 shadow-sm transition hover:bg-white active:scale-95"
            >
              <ArrowLeft size={20} />
              กลับหน้าหลัก
            </button>

            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-pink-500 shadow-sm">
                <MessageCircle size={28} />
              </div>
              <h1 className="text-[26px] font-bold leading-tight text-slate-800" style={fontHead}>
                ติดต่อพยาบาล
              </h1>
            </div>
          </div>
        </header>

        <div className="relative max-w-3xl mx-auto px-4 -mt-8">
          <section className="rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-[0_16px_40px_-24px_rgba(236,72,153,0.4)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-500">
              <Wrench size={30} />
            </div>
            <p className="mt-4 text-[17px] text-slate-500">
              หน้านี้กำลังเตรียมพัฒนา
            </p>
          </section>
        </div>
      </main>
    )
  }

  // =====================================
  // หน้าหลักคุณแม่
  // =====================================

  return (
    <DashboardPage
      user={user}
      onOpenProfile={() => setCurrentPage('profile')}
      onOpenFeeding={() => setCurrentPage('feeding')}
      onOpenAssessment={() => setCurrentPage('assessment')}
      onOpenKnowledge={() => setCurrentPage('knowledge')}
      onOpenHistory={() => setCurrentPage('history')}
      onOpenAppointments={() => setCurrentPage('appointments')}
      onOpenMessages={() => setCurrentPage('messages')}
    />
  )
}

export default App