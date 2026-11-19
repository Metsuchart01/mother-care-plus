import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft,
  HeartPulse,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Check,
  LoaderCircle,
  History,
  Phone,
  ShieldAlert,
  NotebookPen,
  Info,
  CalendarDays,
} from 'lucide-react'

type Props = {
  user: User
  onBack: () => void
}

type Assessment = {
  id: number
  assessment_date: string
  pain_score: number | null
  heavy_bleeding: boolean
  fever: boolean
  breathing_difficulty: boolean
  chest_pain: boolean
  severe_headache: boolean
  vision_changes: boolean
  seizure: boolean
  fainting: boolean
  self_harm_thoughts: boolean
  triage_level: string
  notes: string | null
}

const dangerFields = [
  ['heavy_bleeding', 'มีเลือดออกมากผิดปกติ'],
  ['fever', 'มีไข้'],
  ['breathing_difficulty', 'หายใจลำบาก'],
  ['chest_pain', 'เจ็บหน้าอก'],
  ['severe_headache', 'ปวดศีรษะรุนแรง'],
  ['vision_changes', 'ตามัวหรือมองเห็นผิดปกติ'],
  ['seizure', 'มีอาการชัก'],
  ['fainting', 'เป็นลมหรือหมดสติ'],
  ['self_harm_thoughts', 'มีความคิดทำร้ายตัวเอง'],
] as const

type DangerKey = typeof dangerFields[number][0]

const initialDanger = {
  heavy_bleeding: false,
  fever: false,
  breathing_difficulty: false,
  chest_pain: false,
  severe_headache: false,
  vision_changes: false,
  seizure: false,
  fainting: false,
  self_harm_thoughts: false,
}

/* ---------- สไตล์ (UI เท่านั้น) ---------- */
const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" }
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" }

function painTone(score: number) {
  if (score <= 3) return { text: 'text-emerald-500', label: 'ปวดเล็กน้อย', bg: 'bg-emerald-50' }
  if (score <= 6) return { text: 'text-amber-500', label: 'ปวดปานกลาง', bg: 'bg-amber-50' }
  return { text: 'text-rose-500', label: 'ปวดมาก', bg: 'bg-rose-50' }
}

const triageStyle = {
  red: {
    box: 'bg-rose-50 border-rose-200',
    iconBg: 'bg-rose-500 text-white',
    title: 'text-rose-700',
    text: 'text-rose-700',
    bar: 'bg-rose-400',
    badge: 'bg-rose-100 text-rose-700',
  },
  yellow: {
    box: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-400 text-white',
    title: 'text-amber-800',
    text: 'text-amber-800',
    bar: 'bg-amber-300',
    badge: 'bg-amber-100 text-amber-700',
  },
  green: {
    box: 'bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-400 text-white',
    title: 'text-emerald-800',
    text: 'text-emerald-700',
    bar: 'bg-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700',
  },
} as const

export default function MaternalHealthPage({
  user,
  onBack,
}: Props) {
  const [pain, setPain] = useState(0)
  const [danger, setDanger] = useState(initialDanger)
  const [notes, setNotes] = useState('')
  const [history, setHistory] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const hasEmergency = danger.seizure ||
    danger.fainting ||
    danger.breathing_difficulty ||
    danger.chest_pain ||
    danger.heavy_bleeding ||
    danger.severe_headache ||
    danger.vision_changes ||
    danger.self_harm_thoughts

  const triageLevel = hasEmergency
    ? 'red'
    : danger.fever
      ? 'yellow'
      : 'green'

  async function loadHistory() {
    const { data, error } = await supabase
      .from('postpartum_assessments')
      .select('*')
      .eq('mother_id', user.id)
      .order('assessment_date', { ascending: false })

    if (error) {
      setMessage('โหลดประวัติไม่สำเร็จ: ' + error.message)
    } else {
      setHistory((data || []) as Assessment[])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadHistory()
  }, [user.id])

  async function saveAssessment() {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('postpartum_assessments')
      .insert({
        mother_id: user.id,
        pain_score: pain,
        ...danger,
        notes: notes.trim() || null,
        triage_level: triageLevel,
      })

    if (error) {
      setMessage('บันทึกไม่สำเร็จ: ' + error.message)
    } else {
      setMessage('บันทึกข้อมูลสุขภาพเรียบร้อยแล้ว')
      setPain(0)
      setDanger(initialDanger)
      setNotes('')
      await loadHistory()
    }

    setSaving(false)
  }

  const tone = painTone(pain)
  const tri = triageStyle[triageLevel]
  const selectedCount = dangerFields.filter(([key]) => danger[key as DangerKey]).length
  const isErrorMessage = message.includes('ไม่สำเร็จ')

  return (
    <main className="min-h-screen bg-[#FFF8F3] pb-12 text-slate-700" style={fontBody}>
      {/* ---------- ส่วนหัว ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-pink-200 via-rose-100 to-sky-100 px-4 pt-6 pb-14 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
        <div className="relative max-w-2xl mx-auto">
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
              <HeartPulse size={28} />
            </div>
            <div>
              <h1 className="text-[26px] font-bold leading-tight text-slate-800" style={fontHead}>
                ประเมินสุขภาพคุณแม่
              </h1>
              <p className="text-[15px] text-slate-600">บันทึกสุขภาพหลังคลอด</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-2xl mx-auto px-4 -mt-8 space-y-5">
        {/* ---------- ระดับความเจ็บปวด ---------- */}
        <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(236,72,153,0.4)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[19px] font-bold text-slate-800" style={fontHead}>
                ระดับความเจ็บปวด
              </h2>
              <p className="text-[15px] text-slate-500">คะแนนความเจ็บปวด 0–10</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[14px] font-semibold ${tone.bg} ${tone.text}`}>
              {tone.label}
            </span>
          </div>

          <p className={`mt-4 text-center text-[44px] font-bold leading-none ${tone.text}`} style={fontHead}>
            {pain}
            <span className="text-[22px] text-slate-400"> / 10</span>
          </p>

          <input
            type="range"
            min="0"
            max="10"
            value={pain}
            onChange={e => setPain(Number(e.target.value))}
            aria-label="คะแนนความเจ็บปวด"
            className="mt-5 h-3 w-full cursor-pointer appearance-none rounded-full outline-none
              [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:bg-pink-400 [&::-webkit-slider-thumb]:shadow-md
              [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-pink-400"
            style={{
              background: `linear-gradient(to right, #6ee7b7 0%, #fcd34d 50%, #fb7185 100%) 0 0 / ${pain * 10}% 100% no-repeat, #fce7f3`,
            }}
          />

          <div className="mt-2 flex justify-between text-[13px] text-slate-400">
            <span>ไม่ปวด</span>
            <span>ปวดมากที่สุด</span>
          </div>
        </section>

        {/* ---------- สัญญาณอันตราย ---------- */}
        <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[19px] font-bold text-slate-800" style={fontHead}>
                <ShieldAlert size={22} className="text-rose-400" />
                ประเมินสัญญาณอันตราย
              </h2>
              <p className="text-[15px] text-slate-500">เลือกอาการที่กำลังเกิดขึ้นในขณะนี้</p>
            </div>
            {selectedCount > 0 && (
              <span className="shrink-0 rounded-full bg-rose-100 px-3 py-1 text-[13px] font-semibold text-rose-700">
                เลือก {selectedCount}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {dangerFields.map(([key, label]) => {
              const checked = danger[key]
              return (
                <label
                  key={key}
                  className={`flex min-h-[60px] cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-3 transition active:scale-[0.99] ${
                    checked
                      ? 'border-rose-300 bg-rose-50'
                      : 'border-slate-100 bg-[#FFFDFB] hover:border-pink-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e =>
                      setDanger(prev => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition peer-focus-visible:ring-4 peer-focus-visible:ring-pink-100 ${
                      checked ? 'border-rose-400 bg-rose-400 text-white' : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check size={18} strokeWidth={3} />
                  </span>
                  <span className={`text-[17px] ${checked ? 'font-semibold text-rose-800' : 'text-slate-700'}`}>
                    {label}
                  </span>
                </label>
              )
            })}
          </div>
        </section>

        {/* ---------- บันทึกเพิ่มเติม ---------- */}
        <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-[19px] font-bold text-slate-800" style={fontHead}>
            <NotebookPen size={20} className="text-pink-400" />
            บันทึกเพิ่มเติม
          </h2>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            placeholder="อธิบายอาการเพิ่มเติม..."
            className="w-full rounded-2xl border-2 border-pink-100 bg-[#FFFBF7] p-4 text-[17px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
          />
        </section>

        {/* ---------- ผลคัดกรอง ---------- */}
        <section
          aria-live="polite"
          className={`rounded-3xl border-2 p-5 transition-colors ${tri.box}`}
        >
          <div className="flex items-center gap-3">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tri.iconBg}`}>
              {triageLevel === 'green'
                ? <CheckCircle size={26} />
                : triageLevel === 'yellow'
                  ? <AlertCircle size={26} />
                  : <AlertTriangle size={26} />
              }
            </span>

            <h3 className={`text-[18px] font-bold leading-snug ${tri.title}`} style={fontHead}>
              {triageLevel === 'red'
                ? 'พบสัญญาณอันตราย'
                : triageLevel === 'yellow'
                  ? 'ควรได้รับการประเมินจากบุคลากรทางการแพทย์'
                  : 'ยังไม่พบสัญญาณอันตรายที่กำหนด'
              }
            </h3>
          </div>

          {triageLevel === 'red' && (
            <>
              <p className={`mt-3 text-[16px] leading-relaxed ${tri.text}`}>
                กรุณาไปห้องฉุกเฉินทันที หรือโทร 1669
                โดยเฉพาะหากมีอาการหายใจลำบาก เจ็บหน้าอก
                เลือดออกมาก ชัก หรือหมดสติ
              </p>
              <a
                href="tel:1669"
                className="mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-rose-500 text-[18px] font-bold text-white shadow-[0_10px_20px_-10px_rgba(244,63,94,0.7)] transition hover:bg-rose-600 active:scale-[0.98]"
                style={fontHead}
              >
                <Phone size={20} />
                โทร 1669 ฉุกเฉิน
              </a>
              {danger.self_harm_thoughts && (
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

          {triageLevel === 'yellow' && (
            <p className={`mt-3 text-[16px] leading-relaxed ${tri.text}`}>
              ติดต่อโรงพยาบาลหรือบุคลากรทางการแพทย์โดยเร็ว
              เพื่อประเมินอาการ
            </p>
          )}

          {triageLevel === 'green' && (
            <p className={`mt-3 text-[16px] leading-relaxed ${tri.text}`}>
              หากมีอาการผิดปกติหรือกังวล ควรปรึกษาบุคลากรทางการแพทย์
            </p>
          )}
        </section>

        {/* ---------- ปุ่มบันทึก ---------- */}
        <button
          type="button"
          onClick={saveAssessment}
          disabled={saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-rose-400 text-[18px] font-bold text-white shadow-[0_10px_25px_-8px_rgba(236,72,153,0.6)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
          style={fontHead}
        >
          {saving
            ? <LoaderCircle size={22} className="animate-spin" />
            : <HeartPulse size={22} />
          }
          บันทึกผลการประเมิน
        </button>

        {message && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-2xl border p-4 text-[16px] ${
              isErrorMessage
                ? 'border-red-100 bg-red-50 text-red-700'
                : 'border-emerald-100 bg-emerald-50 text-emerald-700'
            }`}
          >
            {isErrorMessage
              ? <AlertCircle size={22} className="shrink-0" />
              : <CheckCircle size={22} className="shrink-0" />
            }
            {message}
          </div>
        )}

        {/* ---------- ประวัติ ---------- */}
        <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-[19px] font-bold text-slate-800" style={fontHead}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-500">
              <History size={20} />
            </span>
            ประวัติการประเมิน
          </h2>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-[16px] text-slate-500">
              <LoaderCircle size={20} className="animate-spin text-pink-400" />
              กำลังโหลด...
            </div>
          ) : history.length === 0 ? (
            <p className="py-6 text-center text-[16px] text-slate-400">
              ยังไม่มีประวัติการประเมิน
            </p>
          ) : (
            <div className="space-y-3">
              {history.map(item => {
                const s =
                  triageStyle[(item.triage_level as keyof typeof triageStyle)] ?? triageStyle.green
                return (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-100 bg-[#FFFDFB] p-4 pl-5"
                  >
                    <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${s.bar}`} />
                    <p className="flex items-center gap-1.5 text-[15px] font-semibold text-slate-700">
                      <CalendarDays size={16} className="text-pink-400" />
                      {new Date(item.assessment_date).toLocaleString('th-TH')}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-pink-50 px-3 py-1 text-[14px] text-pink-700">
                        ความเจ็บปวด: {item.pain_score ?? '-'} / 10
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[14px] font-semibold ${s.badge}`}>
                        ผลประเมิน: {
                          item.triage_level === 'red'
                            ? 'พบสัญญาณอันตราย'
                            : item.triage_level === 'yellow'
                              ? 'ควรได้รับการประเมิน'
                              : 'ไม่พบสัญญาณอันตรายที่กำหนด'
                        }
                      </span>
                    </div>
                    {item.notes && (
                      <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[15px] leading-relaxed text-slate-600">
                        {item.notes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4">
          <Info size={20} className="mt-0.5 shrink-0 text-sky-400" />
          <p className="text-[13px] leading-relaxed text-slate-500">
            ระบบนี้เป็นเครื่องมือคัดกรองเบื้องต้น ไม่ใช้แทนการวินิจฉัยทางการแพทย์
          </p>
        </div>
      </div>
    </main>
  )
}