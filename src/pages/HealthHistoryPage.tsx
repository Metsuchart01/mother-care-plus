import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  ArrowLeft,
  Heart,
  Milk,
  Timer,
  CalendarDays,
  Droplet,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  LoaderCircle,
  ClipboardList,
  RefreshCw,
  Info,
  ShieldAlert,
  NotebookPen,
  Mail,
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
}

type FeedingLog = {
  id: number
  mother_id: string
  baby_id: number
  record_type: 'nursing' | 'pumping'
  feeding_side: 'left' | 'right' | 'both' | null
  started_at: string
  duration_minutes: number | null
  amount_ml: number | null
  notes: string | null
}

const triageInfo = {
  green: {
    title: 'ความเสี่ยงต่ำ',
    color: 'bg-emerald-100 text-emerald-700',
    bar: 'bg-emerald-300',
    icon: CheckCircle,
  },
  yellow: {
    title: 'ควรเฝ้าระวัง',
    color: 'bg-amber-100 text-amber-700',
    bar: 'bg-amber-300',
    icon: AlertCircle,
  },
  red: {
    title: 'พบสัญญาณอันตราย',
    color: 'bg-rose-100 text-rose-700',
    bar: 'bg-rose-400',
    icon: AlertTriangle,
  },
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('th-TH', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" }
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" }

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#FFFBF7] border border-pink-50 px-4 py-3">
      <p className="text-[13px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-[16px] font-semibold text-slate-800">{value}</p>
    </div>
  )
}

export default function HealthHistoryPage({
  user,
  onBack,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    'assessment' | 'feeding'
  >('assessment')

  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [feedings, setFeedings] = useState<FeedingLog[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [expandedAssessment, setExpandedAssessment] =
    useState<number | null>(null)

  const [expandedFeeding, setExpandedFeeding] =
    useState<number | null>(null)

  useEffect(() => {
    void loadHistory()
  }, [user.id])

  async function loadHistory() {
    setLoading(true)
    setError('')

    const [assessmentResult, feedingResult] = await Promise.all([
      supabase
        .from('postpartum_assessments')
        .select('*')
        .eq('mother_id', user.id)
        .order('assessment_date', { ascending: false }),

      supabase
        .from('feeding_logs')
        .select('*')
        .eq('mother_id', user.id)
        .order('started_at', { ascending: false }),
    ])

    if (assessmentResult.error || feedingResult.error) {
      setError(
        'ไม่สามารถโหลดประวัติได้: ' +
          (assessmentResult.error?.message ||
            feedingResult.error?.message)
      )
    } else {
      setAssessments(
        (assessmentResult.data || []) as Assessment[]
      )

      setFeedings(
        (feedingResult.data || []) as FeedingLog[]
      )
    }

    setLoading(false)
  }

  const emergencyLabels: {
    key: keyof Assessment
    label: string
  }[] = [
    { key: 'heavy_bleeding', label: 'เลือดออกมากผิดปกติ' },
    { key: 'breathing_difficulty', label: 'หายใจลำบาก' },
    { key: 'chest_pain', label: 'เจ็บหน้าอก' },
    { key: 'severe_headache', label: 'ปวดศีรษะรุนแรง' },
    { key: 'vision_changes', label: 'การมองเห็นผิดปกติ' },
    { key: 'seizure', label: 'ชัก' },
    { key: 'fainting', label: 'หมดสติหรือเป็นลม' },
    { key: 'self_harm_thoughts', label: 'มีความคิดทำร้ายตัวเอง' },
  ]

  const warningLabels: {
    key: keyof Assessment
    label: string
  }[] = [
    { key: 'fever', label: 'มีไข้' },
    { key: 'wound_swelling', label: 'แผลบวม' },
    { key: 'wound_redness', label: 'แผลแดง' },
    { key: 'wound_pus', label: 'แผลมีหนอง' },
    {
      key: 'wound_pain_increasing',
      label: 'ปวดแผลเพิ่มขึ้น',
    },
    { key: 'breast_engorgement', label: 'เต้านมคัดตึง' },
    { key: 'nipple_cracked', label: 'หัวนมแตก' },
    { key: 'breast_pain', label: 'เจ็บเต้านม' },
  ]

  return (
    <main className="min-h-screen bg-[#FFF8F3] pb-12 text-slate-700" style={fontBody}>
      {/* ---------- ส่วนหัว ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-teal-100 via-sky-100 to-pink-100 px-4 pt-6 pb-14 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
        <div className="relative max-w-3xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-white/70 px-4 text-[16px] font-semibold text-teal-700 shadow-sm transition hover:bg-white active:scale-95"
          >
            <ArrowLeft size={20} />
            กลับหน้าหลัก
          </button>

          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-teal-500 shadow-sm">
              <ClipboardList size={28} />
            </div>
            <div>
              <h1 className="text-[26px] font-bold leading-tight text-slate-800" style={fontHead}>
                บันทึกสุขภาพ
              </h1>
              <p className="text-[15px] text-slate-600">
                ประวัติสุขภาพคุณแม่และการให้นม
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-3xl mx-auto px-4 -mt-8 space-y-5">
        {/* ---------- บัญชี + สรุป ---------- */}
        <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(236,72,153,0.4)]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-500">
              <Mail size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-slate-500">บัญชีผู้ใช้งาน</p>
              <p className="truncate text-[16px] font-semibold text-slate-800">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-pink-500">
                <Heart size={20} />
              </div>
              <p className="mt-2 text-[30px] font-bold leading-tight text-pink-500" style={fontHead}>
                {assessments.length}
              </p>
              <p className="text-[14px] text-slate-500">ประวัติประเมินสุขภาพ</p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-violet-500">
                <Milk size={20} />
              </div>
              <p className="mt-2 text-[30px] font-bold leading-tight text-violet-500" style={fontHead}>
                {feedings.length}
              </p>
              <p className="text-[14px] text-slate-500">ประวัติบันทึกการให้นม</p>
            </div>
          </div>
        </section>

        {/* ---------- แท็บ ---------- */}
        <section role="tablist" className="relative grid grid-cols-2 rounded-2xl bg-white border border-pink-100 p-1.5 shadow-sm">
          <span
            aria-hidden="true"
            className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl shadow-md transition-all duration-300 ${
              activeTab === 'assessment'
                ? 'translate-x-0 bg-gradient-to-r from-pink-400 to-pink-500'
                : 'translate-x-full bg-gradient-to-r from-violet-400 to-violet-500'
            }`}
          />
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'assessment'}
            onClick={() => setActiveTab('assessment')}
            className={`relative z-10 flex h-12 items-center justify-center gap-2 rounded-xl text-[16px] font-semibold transition-colors ${
              activeTab === 'assessment' ? 'text-white' : 'text-pink-600'
            }`}
          >
            <Heart size={19} />
            ประเมินสุขภาพ
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'feeding'}
            onClick={() => setActiveTab('feeding')}
            className={`relative z-10 flex h-12 items-center justify-center gap-2 rounded-xl text-[16px] font-semibold transition-colors ${
              activeTab === 'feeding' ? 'text-white' : 'text-violet-600'
            }`}
          >
            <Milk size={19} />
            บันทึกการให้นม
          </button>
        </section>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-[15px] text-red-700"
          >
            <AlertCircle size={22} className="shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center border border-pink-100">
            <LoaderCircle className="animate-spin mx-auto text-pink-400" size={34} />
            <p className="text-[16px] text-slate-500 mt-3">กำลังโหลดประวัติ...</p>
          </div>
        ) : activeTab === 'assessment' ? (
          /* ---------- ประวัติประเมิน ---------- */
          <section className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <h2 className="text-[19px] font-bold text-slate-800" style={fontHead}>
                ประวัติประเมินสุขภาพคุณแม่
              </h2>
              <span className="rounded-full bg-pink-50 px-3 py-1 text-[13px] font-semibold text-pink-600">
                {assessments.length} รายการ
              </span>
            </div>

            {assessments.length === 0 ? (
              <div className="rounded-3xl border border-pink-100 bg-white p-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pink-50 text-pink-300">
                  <Heart size={32} />
                </div>
                <p className="mt-3 text-[17px] font-semibold text-slate-600">ยังไม่มีประวัติการประเมิน</p>
                <p className="mt-1 text-[15px] text-slate-400">เมื่อคุณแม่บันทึกผลประเมิน จะแสดงที่นี่</p>
              </div>
            ) : (
              assessments.map((item) => {
                const info =
                  triageInfo[item.triage_level] || triageInfo.green
                const TriageIcon = info.icon

                const expanded = expandedAssessment === item.id

                const activeEmergencies = emergencyLabels.filter(
                  (field) => item[field.key] === true
                )

                const activeWarnings = warningLabels.filter(
                  (field) => item[field.key] === true
                )

                return (
                  <article
                    key={item.id}
                    className="relative overflow-hidden rounded-3xl border border-pink-50 bg-white shadow-sm"
                  >
                    <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${info.bar}`} />

                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedAssessment(
                          expanded ? null : item.id
                        )
                      }
                      className="w-full p-5 pl-6 text-left transition active:bg-pink-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-pink-600">
                            <CalendarDays size={18} className="shrink-0" />
                            <span className="text-[15px] font-semibold">
                              {formatDate(item.assessment_date)}
                            </span>
                          </div>

                          <p className="mt-2 text-[15px] text-slate-600">
                            ระดับความเจ็บปวด:{' '}
                            <span className="font-bold text-slate-800">{item.pain_score ?? '-'}</span> / 10
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold ${info.color}`}
                        >
                          <TriageIcon size={15} />
                          {item.triage_level.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-[14px] font-semibold ${info.color.split(' ')[1]}`}>
                          {info.title}
                        </span>
                        <span className="flex items-center gap-1 text-[14px] text-slate-400">
                          {expanded ? 'ซ่อน' : 'ดูรายละเอียด'}
                          <ChevronDown
                            size={20}
                            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                          />
                        </span>
                      </div>
                    </button>

                    {expanded && (
                      <div className="mx-5 ml-6 mb-5 space-y-4 border-t border-dashed border-pink-100 pt-4">
                        {activeEmergencies.length > 0 && (
                          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                            <p className="mb-2 flex items-center gap-2 text-[16px] font-bold text-rose-700">
                              <ShieldAlert size={20} />
                              สัญญาณอันตรายที่เคยบันทึก
                            </p>
                            <ul className="space-y-1.5">
                              {activeEmergencies.map((field) => (
                                <li key={field.key} className="flex items-center gap-2 text-[15px] text-rose-700">
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" />
                                  {field.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {activeWarnings.length > 0 && (
                          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <p className="mb-2 flex items-center gap-2 text-[16px] font-bold text-amber-700">
                              <AlertCircle size={20} />
                              อาการที่ควรระวัง
                            </p>
                            <ul className="space-y-1.5">
                              {activeWarnings.map((field) => (
                                <li key={field.key} className="flex items-center gap-2 text-[15px] text-amber-700">
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                                  {field.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <DetailRow label="สีของน้ำคาวปลา" value={item.lochia_color || '-'} />
                          <DetailRow label="ปริมาณน้ำคาวปลา" value={item.lochia_amount || '-'} />
                          <DetailRow label="กลิ่นน้ำคาวปลา" value={item.lochia_odor || '-'} />
                          <DetailRow label="อารมณ์" value={item.mood_status || '-'} />
                        </div>

                        {item.notes && (
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="mb-1 flex items-center gap-1.5 text-[13px] text-slate-500">
                              <NotebookPen size={15} />
                              ข้อมูลเพิ่มเติม
                            </p>
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                              {item.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </section>
        ) : (
          /* ---------- ประวัติการให้นม ---------- */
          <section className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <h2 className="text-[19px] font-bold text-slate-800" style={fontHead}>
                ประวัติบันทึกการให้นม
              </h2>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-[13px] font-semibold text-violet-600">
                {feedings.length} รายการ
              </span>
            </div>

            {feedings.length === 0 ? (
              <div className="rounded-3xl border border-violet-100 bg-white p-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-50 text-violet-300">
                  <Milk size={32} />
                </div>
                <p className="mt-3 text-[17px] font-semibold text-slate-600">ยังไม่มีประวัติการให้นม</p>
                <p className="mt-1 text-[15px] text-slate-400">เมื่อบันทึกการให้นมหรือปั๊มนม จะแสดงที่นี่</p>
              </div>
            ) : (
              feedings.map((item) => {
                const expanded = expandedFeeding === item.id
                const isNursing = item.record_type === 'nursing'

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-violet-50 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedFeeding(
                          expanded ? null : item.id
                        )
                      }
                      className="w-full p-5 text-left transition active:bg-violet-50/40"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                            isNursing ? 'bg-pink-100 text-pink-500' : 'bg-violet-100 text-violet-500'
                          }`}
                        >
                          <Milk size={24} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[17px] font-bold text-slate-800" style={fontHead}>
                            {isNursing ? 'ให้นมลูก' : 'ปั๊มนม'}
                          </p>
                          <p className="mt-0.5 text-[14px] text-slate-500">
                            {formatDate(item.started_at)}
                          </p>
                        </div>

                        <ChevronDown
                          size={22}
                          className={`shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                      </div>

                      {(item.duration_minutes !== null || item.amount_ml !== null) && (
                        <div className="mt-3 flex flex-wrap gap-2 text-[14px]">
                          {item.duration_minutes !== null && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-amber-700">
                              <Timer size={15} />
                              {item.duration_minutes} นาที
                            </span>
                          )}

                          {item.amount_ml !== null && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-sky-700">
                              <Droplet size={15} />
                              {item.amount_ml} มล.
                            </span>
                          )}
                        </div>
                      )}
                    </button>

                    {expanded && (
                      <div className="mx-5 mb-5 space-y-2.5 border-t border-dashed border-violet-100 pt-4">
                        <div className="grid grid-cols-2 gap-2.5">
                          <DetailRow
                            label="ประเภท"
                            value={isNursing ? 'ให้นมจากเต้า' : 'ปั๊มน้ำนม'}
                          />
                          <DetailRow
                            label="ข้างที่ให้นม"
                            value={
                              item.feeding_side === 'left'
                                ? 'ซ้าย'
                                : item.feeding_side === 'right'
                                  ? 'ขวา'
                                  : item.feeding_side === 'both'
                                    ? 'สองข้าง'
                                    : '-'
                            }
                          />
                          <DetailRow label="ระยะเวลา" value={`${item.duration_minutes ?? '-'} นาที`} />
                          <DetailRow label="ปริมาณน้ำนม" value={`${item.amount_ml ?? '-'} มล.`} />
                        </div>

                        {item.notes && (
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="mb-1 flex items-center gap-1.5 text-[13px] text-slate-500">
                              <NotebookPen size={15} />
                              หมายเหตุ
                            </p>
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                              {item.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </section>
        )}

        <button
          type="button"
          onClick={() => void loadHistory()}
          disabled={loading}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-pink-100 bg-white text-[17px] font-semibold text-slate-600 transition hover:border-pink-200 hover:text-pink-600 active:scale-[0.98] disabled:opacity-60"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          โหลดประวัติใหม่
        </button>

        <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4">
          <Info size={20} className="mt-0.5 shrink-0 text-sky-400" />
          <p className="text-[13px] leading-relaxed text-slate-500">
            ข้อมูลนี้ใช้สำหรับติดตามสุขภาพเบื้องต้น ไม่ใช้แทนการวินิจฉัยจากแพทย์
            หากมีอาการฉุกเฉิน โทร <span className="font-semibold text-rose-500">1669</span>
          </p>
        </div>
      </div>
    </main>
  )
}