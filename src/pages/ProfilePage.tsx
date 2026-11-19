import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft,
  Baby,
  UserRound,
  Save,
  Plus,
  LoaderCircle,
  Pencil,
  Trash2,
  X,
  Check,
  Phone,
  CalendarDays,
  Weight,
  Ruler,
  Hourglass,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

type ProfilePageProps = {
  user: User
  onBack?: () => void
}

type BabyProfile = {
  id: number
  baby_name: string
  birth_date: string
  sex: string | null
  birth_weight_kg: number | null
  birth_length_cm: number | null
  gestational_age_weeks: number | null
}

/* ---------- สไตล์ (UI เท่านั้น) ---------- */
const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" }
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" }

const inputBase =
  'w-full h-14 px-4 text-[17px] text-slate-800 rounded-2xl border-2 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-4'
const inputPink = `${inputBase} bg-[#FFFBF7] border-pink-100 focus:border-pink-300 focus:ring-pink-100`
const inputSky = `${inputBase} bg-[#FBFDFF] border-sky-100 focus:border-sky-300 focus:ring-sky-100`

function Field({
  label,
  icon,
  children,
  tone = 'text-pink-400',
}: {
  label: string
  icon?: ReactNode
  children: ReactNode
  tone?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[16px] font-semibold text-slate-700">
        {icon && <span className={tone}>{icon}</span>}
        {label}
      </span>
      {children}
    </label>
  )
}

function StatChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-sky-50/70 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sky-500">{icon}</span>
      <div className="min-w-0">
        <p className="text-[13px] text-slate-500">{label}</p>
        <p className="truncate text-[16px] font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export default function ProfilePage({ user, onBack }: ProfilePageProps) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [babies, setBabies] = useState<BabyProfile[]>([])
  const [editingBabyId, setEditingBabyId] = useState<number | null>(null)
  const [babyName, setBabyName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState('unknown')
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [weeks, setWeeks] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')

    const [profileResult, babyResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .maybeSingle(),

      supabase
        .from('baby_profiles')
        .select(
          'id, baby_name, birth_date, sex, birth_weight_kg, birth_length_cm, gestational_age_weeks'
        )
        .eq('mother_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    if (profileResult.error) {
      setError('ไม่สามารถโหลดข้อมูลคุณแม่ได้')
    } else if (profileResult.data) {
      setFullName(profileResult.data.full_name ?? '')
      setPhone(profileResult.data.phone ?? '')
    }

    if (babyResult.error) {
      setError('ไม่สามารถโหลดข้อมูลลูกได้')
    } else {
      setBabies((babyResult.data ?? []) as BabyProfile[])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [user.id])

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      setError('บันทึกข้อมูลคุณแม่ไม่สำเร็จ: ' + error.message)
    } else {
      setMessage('บันทึกข้อมูลคุณแม่เรียบร้อยแล้ว')
    }

    setSaving(false)
  }

  async function addBaby(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    if (birthDate > new Date().toISOString().slice(0, 10)) {
      setError('วันเกิดลูกต้องไม่เป็นวันที่ในอนาคต')
      setSaving(false)
      return
    }

    const babyData = {
      baby_name: babyName.trim(),
      birth_date: birthDate,
      sex,
      birth_weight_kg: weight ? Number(weight) : null,
      birth_length_cm: length ? Number(length) : null,
      gestational_age_weeks: weeks ? Number(weeks) : null,
    }

    const result = editingBabyId !== null
      ? await supabase
          .from('baby_profiles')
          .update({
            ...babyData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingBabyId)
          .eq('mother_id', user.id)
      : await supabase
          .from('baby_profiles')
          .insert({
            ...babyData,
            mother_id: user.id,
          })

    if (result.error) {
      setError(
        `${editingBabyId !== null ? 'แก้ไข' : 'เพิ่ม'}ข้อมูลลูกไม่สำเร็จ: ${result.error.message}`
      )
    } else {
      setMessage(
        editingBabyId !== null
          ? 'แก้ไขข้อมูลลูกเรียบร้อยแล้ว'
          : 'เพิ่มข้อมูลลูกเรียบร้อยแล้ว'
      )

      setEditingBabyId(null)
      setBabyName('')
      setBirthDate('')
      setSex('unknown')
      setWeight('')
      setLength('')
      setWeeks('')

      await loadData()
    }

    setSaving(false)
  }

  function startEditingBaby(baby: BabyProfile) {
    setEditingBabyId(baby.id)
    setBabyName(baby.baby_name)
    setBirthDate(baby.birth_date)
    setSex(baby.sex ?? 'unknown')
    setWeight(baby.birth_weight_kg?.toString() ?? '')
    setLength(baby.birth_length_cm?.toString() ?? '')
    setWeeks(baby.gestational_age_weeks?.toString() ?? '')

    setMessage('')
    setError('')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteBaby(baby: BabyProfile) {
    const confirmed = window.confirm(
      `ต้องการลบข้อมูลของ ${baby.baby_name} ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้`
    )

    if (!confirmed) return

    setSaving(true)
    setMessage('')
    setError('')

    const { error } = await supabase
      .from('baby_profiles')
      .delete()
      .eq('id', baby.id)
      .eq('mother_id', user.id)

    if (error) {
      setError('ลบข้อมูลลูกไม่สำเร็จ: ' + error.message)
    } else {
      setMessage(`ลบข้อมูล ${baby.baby_name} เรียบร้อยแล้ว`)

      if (editingBabyId === baby.id) {
        setEditingBabyId(null)
        setBabyName('')
        setBirthDate('')
        setSex('unknown')
        setWeight('')
        setLength('')
        setWeeks('')
      }

      await loadData()
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FFF8F3] text-[17px] text-slate-500"
        style={fontBody}
      >
        <LoaderCircle size={36} className="animate-spin text-pink-400" />
        กำลังโหลดข้อมูล...
      </div>
    )
  }

  const isEditing = editingBabyId !== null

  return (
    <main className="min-h-screen bg-[#FFF8F3] pb-12 text-slate-700" style={fontBody}>
      {/* ---------- ส่วนหัว ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-sky-200 via-sky-100 to-pink-100 px-4 pt-6 pb-14 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
        <div className="relative max-w-2xl mx-auto">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="กลับหน้าหลัก"
              className="mb-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-white/70 px-4 text-[16px] font-semibold text-sky-700 shadow-sm transition hover:bg-white active:scale-95"
            >
              <ArrowLeft size={20} />
              กลับหน้าหลัก
            </button>
          )}

          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-sky-500 shadow-sm">
              <Baby size={28} />
            </div>
            <div>
              <h1 className="text-[26px] font-bold leading-tight text-slate-800" style={fontHead}>
                โปรไฟล์ของฉัน
              </h1>
              <p className="text-[15px] text-slate-600">ข้อมูลคุณแม่และลูกน้อย</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-2xl mx-auto px-4 -mt-8 space-y-5">
        {message && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-[16px] text-emerald-700 shadow-sm"
          >
            <CheckCircle size={22} className="shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 break-words rounded-2xl border border-red-100 bg-red-50 p-4 text-[16px] text-red-700 shadow-sm"
          >
            <AlertCircle size={22} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ---------- ข้อมูลคุณแม่ ---------- */}
        <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(236,72,153,0.4)]">
          <h2 className="mb-5 flex items-center gap-3 text-[19px] font-bold text-slate-800" style={fontHead}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-pink-50 text-pink-500">
              <UserRound size={22} />
            </span>
            ข้อมูลคุณแม่
          </h2>

          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="ชื่อ-นามสกุล" icon={<UserRound size={18} />}>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputPink}
                placeholder="กรอกชื่อ-นามสกุล"
                autoComplete="name"
              />
            </Field>

            <Field label="เบอร์โทรศัพท์" icon={<Phone size={18} />}>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputPink}
                placeholder="กรอกเบอร์โทรศัพท์"
                autoComplete="tel"
              />
            </Field>

            <button
              type="submit"
              disabled={saving}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-rose-400 text-[18px] font-bold text-white shadow-[0_10px_25px_-8px_rgba(236,72,153,0.6)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
              style={fontHead}
            >
              {saving ? <LoaderCircle size={20} className="animate-spin" /> : <Save size={20} />}
              บันทึกข้อมูลคุณแม่
            </button>
          </form>
        </section>

        {/* ---------- ฟอร์มข้อมูลลูก ---------- */}
        <section
          className={`rounded-3xl border-2 bg-white p-5 shadow-sm transition ${
            isEditing ? 'border-amber-200' : 'border-sky-100'
          }`}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 text-[19px] font-bold text-slate-800" style={fontHead}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-500">
                <Baby size={22} />
              </span>
              {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูลลูก'}
            </h2>
            {isEditing && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[13px] font-semibold text-amber-700">
                <Pencil size={14} />
                กำลังแก้ไข
              </span>
            )}
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditingBabyId(null)
                setBabyName('')
                setBirthDate('')
                setSex('unknown')
                setWeight('')
                setLength('')
                setWeeks('')
                setError('')
                setMessage('')
              }}
              className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white text-[16px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <X size={18} />
              ยกเลิกการแก้ไข
            </button>
          )}

          <form onSubmit={addBaby} className="space-y-4">
            <Field label="ชื่อเล่นหรือชื่อของลูก" icon={<Baby size={18} />} tone="text-sky-400">
              <input
                required
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                className={inputSky}
                placeholder="เช่น น้องมีสุข"
              />
            </Field>

            <Field label="วันเกิด" icon={<CalendarDays size={18} />} tone="text-sky-400">
              <input
                required
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={inputSky}
              />
            </Field>

            <div>
              <p className="mb-2 text-[16px] font-semibold text-slate-700">เพศ</p>
              <div role="radiogroup" aria-label="เพศ" className="grid grid-cols-3 gap-2 rounded-2xl bg-sky-50 p-1.5">
                {([
                  ['unknown', 'ไม่ระบุ'],
                  ['male', 'ชาย'],
                  ['female', 'หญิง'],
                ] as const).map(([value, label]) => {
                  const selected = sex === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSex(value)}
                      className={`flex h-12 items-center justify-center gap-1.5 rounded-xl text-[16px] font-semibold transition ${
                        selected ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {selected && <Check size={16} strokeWidth={3} />}
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="น้ำหนักแรกเกิด (กก.)" icon={<Weight size={18} />} tone="text-sky-400">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  max="10"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={inputSky}
                  placeholder="เช่น 3.20"
                />
              </Field>

              <Field label="ความยาว (ซม.)" icon={<Ruler size={18} />} tone="text-sky-400">
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="100"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className={inputSky}
                  placeholder="เช่น 50"
                />
              </Field>
            </div>

            <Field label="อายุครรภ์ขณะคลอด (สัปดาห์)" icon={<Hourglass size={18} />} tone="text-sky-400">
              <input
                type="number"
                inputMode="numeric"
                min="20"
                max="45"
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                className={inputSky}
                placeholder="เช่น 39"
              />
            </Field>

            <button
              type="submit"
              disabled={saving}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400 text-[18px] font-bold text-white shadow-[0_10px_25px_-8px_rgba(14,165,233,0.6)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
              style={fontHead}
            >
              {saving ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : isEditing ? (
                <Save size={20} />
              ) : (
                <Plus size={20} />
              )}
              {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูลลูก'}
            </button>
          </form>
        </section>

        {/* ---------- รายการลูก ---------- */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 px-1 text-[19px] font-bold text-slate-800" style={fontHead}>
            ข้อมูลลูกที่บันทึกไว้
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[14px] font-semibold text-sky-700">
              {babies.length}
            </span>
          </h2>

          {babies.length === 0 ? (
            <div className="rounded-3xl border border-sky-100 bg-white p-8 text-center">
              <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-sky-50 text-sky-300">
                <Baby size={32} />
              </div>
              <p className="text-[16px] text-slate-500">ยังไม่มีข้อมูลลูก กรุณาเพิ่มข้อมูลด้านบน</p>
            </div>
          ) : (
            babies.map((baby) => (
              <article
                key={baby.id}
                className={`rounded-3xl border-2 bg-white p-5 shadow-sm transition ${
                  editingBabyId === baby.id ? 'border-amber-200 bg-amber-50/30' : 'border-sky-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-100 to-pink-100 text-sky-500">
                    <Baby size={28} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-[19px] font-bold text-slate-800" style={fontHead}>
                      {baby.baby_name}
                    </h3>
                    <p className="flex items-center gap-1.5 text-[15px] text-slate-500">
                      <CalendarDays size={15} />
                      วันเกิด: {new Date(baby.birth_date + 'T00:00:00').toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <StatChip
                    icon={<UserRound size={18} />}
                    label="เพศ"
                    value={baby.sex === 'male' ? 'ชาย' : baby.sex === 'female' ? 'หญิง' : 'ไม่ระบุ'}
                  />
                  <StatChip
                    icon={<Weight size={18} />}
                    label="น้ำหนักแรกเกิด"
                    value={`${baby.birth_weight_kg ?? '-'} กก.`}
                  />
                  <StatChip
                    icon={<Ruler size={18} />}
                    label="ความยาว"
                    value={`${baby.birth_length_cm ?? '-'} ซม.`}
                  />
                  <StatChip
                    icon={<Hourglass size={18} />}
                    label="อายุครรภ์"
                    value={`${baby.gestational_age_weeks ?? '-'} สัปดาห์`}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => startEditingBaby(baby)}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-50 text-[16px] font-semibold text-sky-700 transition hover:bg-sky-100 active:scale-[0.97] disabled:opacity-50"
                  >
                    <Pencil size={18} />
                    แก้ไขข้อมูล
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => deleteBaby(baby)}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-rose-50 text-[16px] font-semibold text-rose-600 transition hover:bg-rose-100 active:scale-[0.97] disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    ลบข้อมูล
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  )
}