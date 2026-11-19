import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { ReactNode, FormEvent } from 'react'
import {
  ArrowLeft,
  Heart,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Check,
  Clock,
  LoaderCircle,
  Save,
  Info,
  Mail,
  Phone,
  CalendarDays,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Props = {
  user: User
  onBack: () => void
}

type TriageLevel = 'green' | 'yellow' | 'red'

type Assessment = {
  id: number
  mother_id: string
  assessment_date: string
  pain_score: number | null
  wound_swelling: boolean
  wound_redness: boolean
  wound_pus: boolean
  wound_pain_increasing: boolean
  lochia_color: string | null
  lochia_amount: string | null
  lochia_odor: string | null
  breast_engorgement: boolean
  nipple_cracked: boolean
  breast_pain: boolean
  mood_status: string | null
  heavy_bleeding: boolean
  fever: boolean
  breathing_difficulty: boolean
  chest_pain: boolean
  severe_headache: boolean
  vision_changes: boolean
  seizure: boolean
  fainting: boolean
  self_harm_thoughts: boolean
  notes: string | null
  triage_level: TriageLevel
  created_at: string
}

const initialForm = {
  pain_score: 0,
  wound_swelling: false,
  wound_redness: false,
  wound_pus: false,
  wound_pain_increasing: false,
  lochia_color: '',
  lochia_amount: '',
  lochia_odor: '',
  breast_engorgement: false,
  nipple_cracked: false,
  breast_pain: false,
  mood_status: '',
  heavy_bleeding: false,
  fever: false,
  breathing_difficulty: false,
  chest_pain: false,
  severe_headache: false,
  vision_changes: false,
  seizure: false,
  fainting: false,
  self_harm_thoughts: false,
  notes: '',
}

type FormData = typeof initialForm

const emergencyFields: {
  key: keyof FormData
  label: string
}[] = [
  { key: 'heavy_bleeding', label: 'มีเลือดออกมากผิดปกติ' },
  { key: 'breathing_difficulty', label: 'หายใจลำบากหรือหอบเหนื่อย' },
  { key: 'chest_pain', label: 'เจ็บหน้าอก' },
  { key: 'severe_headache', label: 'ปวดศีรษะรุนแรง' },
  { key: 'vision_changes', label: 'ตามัวหรือมองเห็นผิดปกติ' },
  { key: 'seizure', label: 'มีอาการชัก' },
  { key: 'fainting', label: 'หมดสติหรือเป็นลม' },
  { key: 'self_harm_thoughts', label: 'มีความคิดทำร้ายตัวเอง' },
]

const warningFields: {
  key: keyof FormData
  label: string
}[] = [
  { key: 'fever', label: 'มีไข้' },
  { key: 'wound_swelling', label: 'แผลบวม' },
  { key: 'wound_redness', label: 'แผลแดง' },
  { key: 'wound_pus', label: 'แผลมีหนอง' },
  {
    key: 'wound_pain_increasing',
    label: 'อาการปวดแผลเพิ่มขึ้น',
  },
]

function calculateTriage(form: FormData): TriageLevel {
  const hasEmergency = emergencyFields.some(
    (field) => form[field.key] === true
  )

  if (hasEmergency) return 'red'

  const hasWarning =
    warningFields.some((field) => form[field.key] === true) ||
    form.pain_score >= 7 ||
    form.lochia_odor === 'foul'

  if (hasWarning) return 'yellow'

  return 'green'
}

const triageInfo = {
  green: {
    title: 'ความเสี่ยงต่ำ',
    description:
      'ไม่พบสัญญาณอันตรายที่ระบุในแบบประเมิน ควรดูแลสุขภาพและติดตามอาการต่อเนื่อง',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
    iconBg: 'bg-emerald-400 text-white',
    bar: 'bg-emerald-300',
  },
  yellow: {
    title: 'ควรได้รับการประเมินจากบุคลากรทางการแพทย์',
    description:
      'พบอาการที่ควรระวัง กรุณาติดต่อโรงพยาบาลหรือบุคลากรทางการแพทย์โดยเร็วในวันนี้',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    iconBg: 'bg-amber-400 text-white',
    bar: 'bg-amber-300',
  },
  red: {
    title: 'พบสัญญาณอันตราย',
    description:
      'ควรได้รับความช่วยเหลือฉุกเฉินทันที โทร 1669 หรือไปห้องฉุกเฉิน',
    color: 'bg-rose-50 border-rose-200 text-rose-800',
    badge: 'bg-rose-100 text-rose-700',
    iconBg: 'bg-rose-500 text-white',
    bar: 'bg-rose-400',
  },
}

/* ---------- สไตล์ (UI เท่านั้น) ---------- */
const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" }
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" }

type Tone = 'pink' | 'red' | 'amber'

const toneStyle: Record<Tone, { on: string; box: string; text: string }> = {
  pink: { on: 'border-pink-300 bg-pink-50', box: 'border-pink-400 bg-pink-400', text: 'text-pink-800' },
  red: { on: 'border-rose-300 bg-rose-50', box: 'border-rose-400 bg-rose-400', text: 'text-rose-800' },
  amber: { on: 'border-amber-300 bg-amber-50', box: 'border-amber-400 bg-amber-400', text: 'text-amber-800' },
}

function painTone(score: number) {
  if (score <= 3) return { text: 'text-emerald-500', bg: 'bg-emerald-50', label: 'ปวดเล็กน้อย' }
  if (score <= 6) return { text: 'text-amber-500', bg: 'bg-amber-50', label: 'ปวดปานกลาง' }
  return { text: 'text-rose-500', bg: 'bg-rose-50', label: 'ปวดมาก' }
}

// ปุ่มเลือก checkbox แบบการ์ดใหญ่
function CheckItem({
  field,
  label,
  checked,
  onChange,
  tone = 'pink',
}: {
  field: keyof FormData
  label: string
  checked: boolean
  onChange: (field: keyof FormData, value: boolean) => void
  tone?: Tone
}) {
  const t = toneStyle[tone]
  return (
    <label
      className={`flex min-h-[60px] cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-3 transition active:scale-[0.99] ${
        checked ? t.on : 'border-slate-100 bg-[#FFFDFB] hover:border-pink-100'
      }`}
    >
      <input
        type="checkbox"
        name={String(field)}
        checked={checked}
        onChange={(event) => onChange(field, event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition peer-focus-visible:ring-4 peer-focus-visible:ring-pink-100 ${
          checked ? `${t.box} text-white` : 'border-slate-300 bg-white text-transparent'
        }`}
      >
        <Check size={18} strokeWidth={3} />
      </span>
      <span className={`text-[17px] ${checked ? `font-semibold ${t.text}` : 'text-slate-700'}`}>{label}</span>
    </label>
  )
}

// ปุ่มตัวเลือกแบบชิป (แทน select เดิม ค่าเหมือนเดิมทุกตัว)
function ChoiceGroup({
  label,
  value,
  options,
  onChange,
  columns = 'grid-cols-2 sm:grid-cols-3',
}: {
  label: string
  value: string
  options: { value: string; label: string; danger?: boolean }[]
  onChange: (value: string) => void
  columns?: string
}) {
  return (
    <div>
      <p className="mb-2 text-[16px] font-semibold text-slate-700">{label}</p>
      <div role="radiogroup" aria-label={label} className={`grid gap-2 ${columns}`}>
        {options.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? '' : option.value)}
              className={`flex h-12 items-center justify-center gap-1.5 rounded-2xl border-2 px-3 text-[16px] font-semibold transition active:scale-[0.97] ${
                selected
                  ? option.danger
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-pink-300 bg-pink-50 text-pink-700'
                  : 'border-slate-100 bg-[#FFFDFB] text-slate-600 hover:border-pink-100'
              }`}
            >
              {selected && <Check size={16} strokeWidth={3} />}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Section({
  step,
  title,
  children,
}: {
  step?: number
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-3 text-[19px] font-bold text-slate-800" style={fontHead}>
        {step !== undefined && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-300 to-pink-400 text-[16px] text-white">
            {step}
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function PostpartumAssessmentPage({
  user,
  onBack,
}: Props) {
  const [form, setForm] = useState<FormData>(() => ({ ...initialForm }))
  const [history, setHistory] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const triage = calculateTriage(form)
  const info = triageInfo[triage]

  useEffect(() => {
    let active = true

    async function loadHistory() {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('postpartum_assessments')
        .select('*')
        .eq('mother_id', user.id)
        .order('assessment_date', { ascending: false })
        .limit(20)

      if (!active) return

      if (error) {
        setError('ไม่สามารถโหลดประวัติได้: ' + error.message)
      } else {
        setHistory((data || []) as Assessment[])
      }

      setLoading(false)
    }

    void loadHistory()

    return () => {
      active = false
    }
  }, [user.id])

  function updateField<K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }))
    setSuccess('')
  }

  function updateCheck(field: keyof FormData, value: boolean) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
    setSuccess('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    const currentTriage = calculateTriage(form)

    const payload = {
      mother_id: user.id,
      assessment_date: new Date().toISOString(),
      pain_score: form.pain_score,

      wound_swelling: form.wound_swelling,
      wound_redness: form.wound_redness,
      wound_pus: form.wound_pus,
      wound_pain_increasing: form.wound_pain_increasing,

      lochia_color: form.lochia_color || null,
      lochia_amount: form.lochia_amount || null,
      lochia_odor: form.lochia_odor || null,

      breast_engorgement: form.breast_engorgement,
      nipple_cracked: form.nipple_cracked,
      breast_pain: form.breast_pain,

      mood_status: form.mood_status || null,

      heavy_bleeding: form.heavy_bleeding,
      fever: form.fever,
      breathing_difficulty: form.breathing_difficulty,
      chest_pain: form.chest_pain,
      severe_headache: form.severe_headache,
      vision_changes: form.vision_changes,
      seizure: form.seizure,
      fainting: form.fainting,
      self_harm_thoughts: form.self_harm_thoughts,

      notes: form.notes.trim() || null,
      triage_level: currentTriage,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('postpartum_assessments')
      .insert(payload)

    if (error) {
      setError('บันทึกไม่สำเร็จ: ' + error.message)
      setSaving(false)
      return
    }

    setSuccess('บันทึกผลประเมินสุขภาพเรียบร้อยแล้ว')
    setForm({ ...initialForm })

    const { data, error: historyError } = await supabase
      .from('postpartum_assessments')
      .select('*')
      .eq('mother_id', user.id)
      .order('assessment_date', { ascending: false })
      .limit(20)

    if (historyError) {
      setError('บันทึกสำเร็จ แต่โหลดประวัติไม่สำเร็จ: ' + historyError.message)
    } else {
      setHistory((data || []) as Assessment[])
    }

    setSaving(false)

    if (currentTriage === 'red') {
      setError(
        'พบสัญญาณอันตราย! กรุณาขอความช่วยเหลือฉุกเฉินทันที โทร 1669'
      )
    }
  }

  const tone = painTone(form.pain_score)

  return (
    <main className="min-h-screen bg-[#FFF8F3] pb-12 text-slate-700" style={fontBody}>
      {/* ---------- ส่วนหัว ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-pink-200 via-rose-100 to-sky-100 px-4 pt-6 pb-14 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
        <div className="relative max-w-3xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-white/70 px-4 text-[16px] font-semibold text-pink-700 shadow-sm transition hover:bg-white active:scale-95"
          >
            <ArrowLeft size={20} />
            กลับหน้าหลัก
          </button>

          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-pink-500 shadow-sm">
              <Heart size={28} />
            </div>
            <div>
              <h1 className="text-[26px] font-bold leading-tight text-slate-800" style={fontHead}>
                ประเมินสุขภาพคุณแม่
              </h1>
              <p className="text-[15px] text-slate-600">Postpartum Health Assessment</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-3xl mx-auto px-4 -mt-8 space-y-5">
        <div className="flex items-center gap-3 rounded-3xl border border-pink-100 bg-white p-4 shadow-[0_16px_40px_-24px_rgba(236,72,153,0.4)]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-500">
            <Mail size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] text-slate-500">บัญชีผู้ใช้งาน</p>
            <p className="truncate text-[16px] font-semibold text-slate-800">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1 */}
          <Section step={1} title="อาการทั่วไปหลังคลอด">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[16px] font-semibold text-slate-700">ระดับความเจ็บปวด (0–10)</p>
                <span className={`rounded-full px-3 py-1 text-[14px] font-semibold ${tone.bg} ${tone.text}`}>
                  {tone.label}
                </span>
              </div>

              <p className={`mt-3 text-center text-[44px] font-bold leading-none ${tone.text}`} style={fontHead}>
                {form.pain_score}
                <span className="text-[22px] text-slate-400"> / 10</span>
              </p>

              <input
                type="range"
                min="0"
                max="10"
                value={form.pain_score}
                aria-label="ระดับความเจ็บปวด"
                onChange={(e) =>
                  updateField('pain_score', Number(e.target.value))
                }
                className="mt-5 h-3 w-full cursor-pointer appearance-none rounded-full outline-none
                  [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:bg-pink-400 [&::-webkit-slider-thumb]:shadow-md
                  [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-pink-400"
                style={{
                  background: `linear-gradient(to right, #6ee7b7 0%, #fcd34d 50%, #fb7185 100%) 0 0 / ${form.pain_score * 10}% 100% no-repeat, #fce7f3`,
                }}
              />

              <div className="mt-2 flex justify-between text-[13px] text-slate-400">
                <span>0 = ไม่เจ็บ</span>
                <span>10 = เจ็บมากที่สุด</span>
              </div>
            </div>
          </Section>

          {/* 2 */}
          <Section step={2} title="อาการแผลหลังคลอด">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <CheckItem field="wound_swelling" label="แผลบวม" checked={form.wound_swelling} onChange={updateCheck} tone="amber" />
              <CheckItem field="wound_redness" label="แผลแดง" checked={form.wound_redness} onChange={updateCheck} tone="amber" />
              <CheckItem field="wound_pus" label="แผลมีหนอง" checked={form.wound_pus} onChange={updateCheck} tone="amber" />
              <CheckItem field="wound_pain_increasing" label="ปวดแผลเพิ่มขึ้น" checked={form.wound_pain_increasing} onChange={updateCheck} tone="amber" />
            </div>
          </Section>

          {/* 3 */}
          <Section step={3} title="น้ำคาวปลา">
            <div className="space-y-5">
              <ChoiceGroup
                label="สีของน้ำคาวปลา"
                value={form.lochia_color}
                onChange={(v) => updateField('lochia_color', v)}
                options={[
                  { value: 'red', label: 'สีแดง' },
                  { value: 'pink', label: 'สีชมพู' },
                  { value: 'brown', label: 'สีน้ำตาล' },
                  { value: 'yellow', label: 'สีเหลือง' },
                  { value: 'white', label: 'สีขาว' },
                  { value: 'other', label: 'อื่น ๆ' },
                ]}
              />

              <ChoiceGroup
                label="ปริมาณน้ำคาวปลา"
                value={form.lochia_amount}
                onChange={(v) => updateField('lochia_amount', v)}
                columns="grid-cols-3"
                options={[
                  { value: 'little', label: 'น้อย' },
                  { value: 'moderate', label: 'ปานกลาง' },
                  { value: 'much', label: 'มาก' },
                ]}
              />

              <ChoiceGroup
                label="กลิ่นน้ำคาวปลา"
                value={form.lochia_odor}
                onChange={(v) => updateField('lochia_odor', v)}
                columns="grid-cols-2"
                options={[
                  { value: 'normal', label: 'กลิ่นปกติ' },
                  { value: 'foul', label: 'กลิ่นเหม็นผิดปกติ', danger: true },
                ]}
              />
            </div>
          </Section>

          {/* 4 */}
          <Section step={4} title="สุขภาพเต้านมและหัวนม">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <CheckItem field="breast_engorgement" label="เต้านมคัดตึง" checked={form.breast_engorgement} onChange={updateCheck} />
              <CheckItem field="nipple_cracked" label="หัวนมแตก" checked={form.nipple_cracked} onChange={updateCheck} />
              <CheckItem field="breast_pain" label="เจ็บเต้านม" checked={form.breast_pain} onChange={updateCheck} />
            </div>
          </Section>

          {/* 5 */}
          <Section step={5} title="สภาพจิตใจและอารมณ์">
            <ChoiceGroup
              label="วันนี้คุณแม่รู้สึกอย่างไร?"
              value={form.mood_status}
              onChange={(v) => updateField('mood_status', v)}
              options={[
                { value: 'happy', label: 'มีความสุข' },
                { value: 'normal', label: 'ปกติ' },
                { value: 'stressed', label: 'เครียด' },
                { value: 'sad', label: 'เศร้า' },
                { value: 'anxious', label: 'วิตกกังวล' },
                { value: 'exhausted', label: 'เหนื่อยล้า' },
              ]}
            />
          </Section>

          {/* 6 */}
          <Section step={6} title="ตรวจสอบสัญญาณอันตราย">
            <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              <AlertTriangle size={22} className="mt-0.5 shrink-0" />
              <p className="text-[16px] font-semibold leading-relaxed">
                หากมีอาการข้อใดข้อหนึ่ง ให้ขอความช่วยเหลือฉุกเฉินทันที
              </p>
            </div>

            <div className="space-y-2.5">
              {emergencyFields.map((field) => (
                <CheckItem
                  key={field.key}
                  field={field.key}
                  label={field.label}
                  checked={form[field.key] === true}
                  onChange={updateCheck}
                  tone="red"
                />
              ))}
            </div>

            <div className="border-t border-dashed border-pink-100 pt-4">
              <p className="mb-3 flex items-center gap-2 text-[17px] font-bold text-slate-700" style={fontHead}>
                <AlertCircle size={20} className="text-amber-500" />
                อาการที่ควรระวังเพิ่มเติม
              </p>

              <div className="space-y-2.5">
                {warningFields.map((field) => (
                  <CheckItem
                    key={field.key}
                    field={field.key}
                    label={field.label}
                    checked={form[field.key] === true}
                    onChange={updateCheck}
                    tone="amber"
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* 7 */}
          <Section step={7} title="ข้อมูลเพิ่มเติม">
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={4}
              placeholder="บันทึกอาการหรือข้อมูลเพิ่มเติม..."
              className="w-full resize-y rounded-2xl border-2 border-pink-100 bg-[#FFFBF7] p-4 text-[17px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
            />
          </Section>

          {/* ผลคัดกรอง */}
          <section aria-live="polite" className={`rounded-3xl border-2 p-5 transition-colors ${info.color}`}>
            <div className="flex items-center gap-3">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${info.iconBg}`}>
                {triage === 'green' ? (
                  <CheckCircle size={26} />
                ) : triage === 'yellow' ? (
                  <AlertCircle size={26} />
                ) : (
                  <AlertTriangle size={26} />
                )}
              </span>

              <div>
                <p className="text-[13px] font-semibold opacity-80">ผลการคัดกรองเบื้องต้น</p>
                <h2 className="text-[18px] font-bold leading-snug" style={fontHead}>
                  {triage.toUpperCase()} — {info.title}
                </h2>
              </div>
            </div>

            <p className="mt-3 text-[16px] leading-relaxed">{info.description}</p>

            {triage === 'red' && (
              <>
                <a
                  href="tel:1669"
                  className="mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-rose-500 text-[18px] font-bold text-white shadow-[0_10px_20px_-10px_rgba(244,63,94,0.7)] transition hover:bg-rose-600 active:scale-[0.98]"
                  style={fontHead}
                >
                  <Phone size={20} />
                  โทร 1669 ฉุกเฉิน
                </a>
                {form.self_harm_thoughts && (
                  <a
                    href="tel:1323"
                    className="mt-2.5 flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-violet-200 bg-white text-[17px] font-bold text-violet-600 transition hover:bg-violet-50 active:scale-[0.98]"
                    style={fontHead}
                  >
                    <Phone size={20} />
                    สายด่วนสุขภาพจิต 1323 (24 ชม.)
                  </a>
                )}
              </>
            )}
          </section>

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-[16px] text-red-700">
              <AlertCircle size={22} className="shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-[16px] text-emerald-700">
              <CheckCircle size={22} className="shrink-0" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-rose-400 text-[18px] font-bold text-white shadow-[0_10px_25px_-8px_rgba(236,72,153,0.6)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
            style={fontHead}
          >
            {saving ? (
              <>
                <LoaderCircle size={22} className="animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save size={20} />
                บันทึกผลประเมินสุขภาพ
              </>
            )}
          </button>
        </form>

        {/* ---------- ประวัติ ---------- */}
        <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-3 text-[19px] font-bold text-slate-800" style={fontHead}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-pink-50 text-pink-500">
              <Clock size={20} />
            </span>
            ประวัติการประเมินสุขภาพ
          </h2>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-[16px] text-slate-500">
              <LoaderCircle size={20} className="animate-spin text-pink-400" />
              กำลังโหลดประวัติ...
            </div>
          ) : history.length === 0 ? (
            <p className="py-6 text-center text-[16px] text-slate-400">ยังไม่มีประวัติการประเมิน</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const itemInfo = triageInfo[item.triage_level] || triageInfo.green

                return (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-100 bg-[#FFFDFB] p-4 pl-5"
                  >
                    <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${itemInfo.bar}`} />
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-[15px] font-semibold text-slate-700">
                        <CalendarDays size={16} className="text-pink-400" />
                        {new Date(item.assessment_date).toLocaleString('th-TH')}
                      </p>

                      <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${itemInfo.badge}`}>
                        {item.triage_level.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-pink-50 px-3 py-1 text-[14px] text-pink-700">
                        ระดับความเจ็บปวด: {item.pain_score ?? '-'} / 10
                      </span>
                      <span className="text-[14px] text-slate-500">{itemInfo.title}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4">
          <Info size={20} className="mt-0.5 shrink-0 text-sky-400" />
          <p className="text-[13px] leading-relaxed text-slate-500">
            ระบบนี้ใช้สำหรับคัดกรองเบื้องต้น ไม่สามารถใช้แทนการวินิจฉัยของแพทย์ได้
            หากมีอาการฉุกเฉิน โทร <span className="font-semibold text-rose-500">1669</span>
          </p>
        </div>
      </div>
    </main>
  )
}