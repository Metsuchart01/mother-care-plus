import { useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

/* ---------- ไอคอนแบบเส้น (SVG) ใช้แทนอีโมจิ ---------- */
type IconProps = { className?: string }

const IconLogo = ({ className = '' }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <circle cx="24" cy="24" r="23" fill="url(#mcpGrad)" />
    <path
      d="M24 35s-10-6.2-10-13.3A5.7 5.7 0 0 1 24 18a5.7 5.7 0 0 1 10 3.7C34 28.8 24 35 24 35Z"
      fill="#fff"
    />
    <circle cx="24" cy="25.5" r="3.2" fill="#F9A8C9" />
    <defs>
      <linearGradient id="mcpGrad" x1="0" y1="0" x2="48" y2="48">
        <stop stopColor="#F9A8C9" />
        <stop offset="1" stopColor="#A5D8F3" />
      </linearGradient>
    </defs>
  </svg>
)

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const IconUser = ({ className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
  </svg>
)

const IconPhone = ({ className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M10.5 18h3" />
  </svg>
)

const IconMail = ({ className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
)

const IconLock = ({ className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
)

const IconShield = ({ className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const IconInfo = ({ className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
)

const IconCheck = ({ className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </svg>
)

const IconSpinner = ({ className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" fill="none" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
)

/* ---------- ช่องกรอกข้อมูลพร้อมไอคอน ---------- */
function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string
  label: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[17px] font-medium text-slate-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pink-300">
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

const inputClass =
  'w-full h-14 pl-12 pr-4 text-[17px] text-slate-800 bg-[#FFFBF7] border-2 border-pink-100 rounded-2xl ' +
  'placeholder:text-slate-400 outline-none transition ' +
  'focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100'

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')

    if (isRegister && password !== confirmPassword) {
      setMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    if (password.length < 8) {
      setMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    setLoading(true)

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
          },
        })

        if (error) throw error

        setMessage(
          'สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อกดยืนยันบัญชีก่อนเข้าสู่ระบบ'
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        setMessage('เข้าสู่ระบบสำเร็จ')
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      )
    } finally {
      setLoading(false)
    }
  }

  // ใช้เพื่อเลือกสีกล่องข้อความเท่านั้น (ไม่กระทบการทำงาน)
  const isSuccess = message.includes('สำเร็จ')

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#FFF8F3] flex items-center justify-center px-4 py-10"
      style={{ fontFamily: "'Sarabun', 'Prompt', sans-serif" }}
    >
      {/* พื้นหลังวงกลมพาสเทล */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-amber-100/60 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* ส่วนหัว */}
        <header className="text-center mb-6">
          <IconLogo className="mx-auto h-20 w-20 drop-shadow-[0_8px_20px_rgba(244,114,182,0.35)]" />
          <h1
            className="mt-4 text-[30px] leading-tight font-bold tracking-wide text-pink-500"
            style={{ fontFamily: "'Prompt', 'Sarabun', sans-serif" }}
          >
            MOTHER CARE <span className="text-sky-400">PLUS</span>
          </h1>
          <p className="mt-1.5 text-[17px] text-slate-500">
            ดูแลคุณแม่และลูกน้อย ด้วยความใส่ใจ
          </p>
        </header>

        {/* การ์ดฟอร์ม */}
        <section className="bg-white/90 backdrop-blur rounded-[28px] border border-pink-100 shadow-[0_20px_50px_-20px_rgba(236,72,153,0.35)] p-6 sm:p-8">
          {/* สลับแท็บ */}
          <div
            role="tablist"
            className="relative grid grid-cols-2 bg-pink-50 rounded-2xl p-1.5 mb-7"
          >
            <span
              aria-hidden="true"
              className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 shadow-md transition-transform duration-300 ${
                isRegister ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => {
                setIsRegister(false)
                setMessage('')
              }}
              className={`relative z-10 h-12 rounded-xl text-[17px] font-semibold transition-colors ${
                !isRegister ? 'text-white' : 'text-slate-500'
              }`}
            >
              เข้าสู่ระบบ
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => {
                setIsRegister(true)
                setMessage('')
              }}
              className={`relative z-10 h-12 rounded-xl text-[17px] font-semibold transition-colors ${
                isRegister ? 'text-white' : 'text-slate-500'
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <>
                <Field id="fullName" label="ชื่อ-นามสกุล" icon={<IconUser className="h-6 w-6" />}>
                  <input
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="กรอกชื่อ-นามสกุล"
                    autoComplete="name"
                    className={inputClass}
                  />
                </Field>

                <Field id="phone" label="เบอร์โทรศัพท์" icon={<IconPhone className="h-6 w-6" />}>
                  <input
                    id="phone"
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="กรอกเบอร์โทรศัพท์"
                    autoComplete="tel"
                    inputMode="tel"
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            <Field id="email" label="อีเมล" icon={<IconMail className="h-6 w-6" />}>
              <input
                id="email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                className={inputClass}
              />
            </Field>

            <Field id="password" label="รหัสผ่าน" icon={<IconLock className="h-6 w-6" />}>
              <input
                id="password"
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className={inputClass}
              />
            </Field>

            {isRegister && (
              <Field id="confirmPassword" label="ยืนยันรหัสผ่าน" icon={<IconShield className="h-6 w-6" />}>
                <input
                  id="confirmPassword"
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  autoComplete="new-password"
                  className={inputClass}
                />
              </Field>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-rose-400 text-white text-[18px] font-bold shadow-[0_10px_25px_-8px_rgba(236,72,153,0.6)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
              style={{ fontFamily: "'Prompt', 'Sarabun', sans-serif" }}
            >
              {loading && <IconSpinner className="h-5 w-5" />}
              {loading
                ? 'กำลังดำเนินการ...'
                : isRegister
                  ? 'สมัครสมาชิก'
                  : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {message && (
            <div
              role="status"
              className={`mt-6 flex items-start gap-3 p-4 rounded-2xl text-[16px] leading-relaxed border ${
                isSuccess
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : 'bg-sky-50 border-sky-100 text-sky-800'
              }`}
            >
              {isSuccess ? (
                <IconCheck className="h-6 w-6 shrink-0 text-emerald-500" />
              ) : (
                <IconInfo className="h-6 w-6 shrink-0 text-sky-500" />
              )}
              <span>{message}</span>
            </div>
          )}
        </section>

        <p className="text-center text-sm text-slate-400 mt-6">
          MOTHER CARE PLUS | ระบบดูแลสุขภาพแม่และเด็ก
        </p>
      </div>
    </main>
  )
}