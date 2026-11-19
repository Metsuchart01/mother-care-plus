import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  AlertCircle,
  ArrowLeft,
  Baby as BabyIcon,
  CalendarClock,
  CheckCircle2,
  Droplet,
  Info,
  LoaderCircle,
  Milk,
  NotebookPen,
  Pencil,
  Timer,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Baby = {
  id: number
  baby_name: string
  birth_date: string
}

type FeedingLog = {
  id: number
  baby_id: number
  mother_id: string
  record_type: 'nursing' | 'pumping'
  feeding_side: 'left' | 'right' | 'both' | null
  started_at: string
  duration_minutes: number | null
  amount_ml: number | null
  notes: string | null
}

type Props = {
  user: User
  onBack?: () => void
}

function localDateTimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16)
}

/* ---------- สไตล์ที่ใช้ซ้ำ ---------- */
const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" }
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" }

const inputClass =
  'w-full h-14 px-4 text-[17px] text-slate-800 bg-[#FFFBF7] border-2 border-pink-100 rounded-2xl ' +
  'placeholder:text-slate-400 outline-none transition ' +
  'focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100'

function FieldLabel({ icon, children, htmlFor }: { icon?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-center gap-2 text-[16px] font-semibold text-slate-700">
      {icon && <span className="text-pink-400">{icon}</span>}
      {children}
    </label>
  )
}

function FeedingTrackerPage({ user, onBack }: Props) {
  const [babies, setBabies] = useState<Baby[]>([])
  const [logs, setLogs] = useState<FeedingLog[]>([])
  const [babyId, setBabyId] = useState('')
  const [recordType, setRecordType] = useState<'nursing' | 'pumping'>('nursing')
  const [feedingSide, setFeedingSide] = useState<'left' | 'right' | 'both'>('both')
  const [startedAt, setStartedAt] = useState(localDateTimeValue())
  const [duration, setDuration] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    const [babyResult, logResult] = await Promise.all([
      supabase
        .from('baby_profiles')
        .select('id, baby_name, birth_date')
        .eq('mother_id', user.id)
        .order('created_at', { ascending: true }),

      supabase
        .from('feeding_logs')
        .select('*')
        .eq('mother_id', user.id)
        .order('started_at', { ascending: false }),
    ])

    if (babyResult.error) {
      setError('โหลดข้อมูลลูกไม่สำเร็จ: ' + babyResult.error.message)
    } else {
      setBabies(babyResult.data ?? [])
      if (babyResult.data?.length && !babyId) {
        setBabyId(String(babyResult.data[0].id))
      }
    }

    if (logResult.error) {
      setError('โหลดประวัติไม่สำเร็จ: ' + logResult.error.message)
    } else {
      setLogs(logResult.data ?? [])
    }

    setLoading(false)
  }, [user.id, babyId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function resetForm() {
    setEditingId(null)
    setRecordType('nursing')
    setFeedingSide('both')
    setStartedAt(localDateTimeValue())
    setDuration('')
    setAmount('')
    setNotes('')
    setMessage('')
    setError('')
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!babyId) {
      setError('กรุณาเลือกข้อมูลลูก')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const data = {
      mother_id: user.id,
      baby_id: Number(babyId),
      record_type: recordType,
      feeding_side: recordType === 'nursing' ? feedingSide : null,
      started_at: new Date(startedAt).toISOString(),
      duration_minutes: duration ? Number(duration) : null,
      amount_ml: recordType === 'pumping' && amount ? Number(amount) : null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const result = editingId !== null
      ? await supabase
          .from('feeding_logs')
          .update(data)
          .eq('id', editingId)
          .eq('mother_id', user.id)
      : await supabase
          .from('feeding_logs')
          .insert(data)

    if (result.error) {
      setError('บันทึกไม่สำเร็จ: ' + result.error.message)
    } else {
      setMessage(editingId !== null ? 'แก้ไขรายการสำเร็จ' : 'บันทึกสำเร็จ')
      resetForm()
      await loadData()
    }

    setSaving(false)
  }

  function startEdit(log: FeedingLog) {
    setEditingId(log.id)
    setBabyId(String(log.baby_id))
    setRecordType(log.record_type)
    setFeedingSide(log.feeding_side ?? 'both')
    setStartedAt(localDateTimeValue(new Date(log.started_at)))
    setDuration(log.duration_minutes?.toString() ?? '')
    setAmount(log.amount_ml?.toString() ?? '')
    setNotes(log.notes ?? '')
    setError('')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(log: FeedingLog) {
    if (!window.confirm('ต้องการลบรายการบันทึกนี้ใช่หรือไม่?')) return

    setSaving(true)
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('feeding_logs')
      .delete()
      .eq('id', log.id)
      .eq('mother_id', user.id)

    if (error) {
      setError('ลบรายการไม่สำเร็จ: ' + error.message)
    } else {
      setMessage('ลบรายการเรียบร้อยแล้ว')
      if (editingId === log.id) resetForm()
      await loadData()
    }

    setSaving(false)
  }

  const selectedLogs = useMemo(
    () => logs.filter((log) => String(log.baby_id) === babyId),
    [logs, babyId]
  )

  const todayLogs = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA')
    return selectedLogs.filter(
      (log) => new Date(log.started_at).toLocaleDateString('en-CA') === today
    )
  }, [selectedLogs])

  const todayNursing = todayLogs.filter(
    (log) => log.record_type === 'nursing'
  ).length

  const todayPumping = todayLogs.filter(
    (log) => log.record_type === 'pumping'
  )

  const totalMilk = todayPumping.reduce(
    (sum, log) => sum + Number(log.amount_ml ?? 0),
    0
  )

  function formatDate(date: string) {
    return new Date(date).toLocaleString('th-TH', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
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

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-12 text-slate-700" style={fontBody}>
      {/* ---------- ส่วนหัว ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-pink-200 via-pink-100 to-sky-100 px-4 pt-6 pb-14 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
        <div className="relative max-w-3xl mx-auto">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-white/70 px-4 text-[16px] font-semibold text-pink-700 shadow-sm transition hover:bg-white active:scale-95"
            >
              <ArrowLeft size={20} />
              กลับ
            </button>
          )}
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-violet-500 shadow-sm">
              <Milk size={28} />
            </div>
            <div>
              <h1 className="text-[26px] font-bold leading-tight text-slate-800" style={fontHead}>
                บันทึกการให้นม
              </h1>
              <p className="text-[15px] text-slate-600">
                บันทึกกิจกรรมการให้นมและปั๊มนม
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-3xl mx-auto px-4 -mt-8 space-y-5">
        {babies.length === 0 ? (
          <div className="rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-sky-500">
              <BabyIcon size={32} />
            </div>
            <p className="text-[17px] text-slate-600 leading-relaxed">
              ยังไม่มีข้อมูลลูก กรุณาเพิ่มข้อมูลลูกในหน้าโปรไฟล์ก่อน
            </p>
          </div>
        ) : (
          <>
            {/* ---------- เลือกลูก ---------- */}
            <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(236,72,153,0.4)]">
              <FieldLabel htmlFor="babySelect" icon={<BabyIcon size={20} />}>
                เลือกข้อมูลลูก
              </FieldLabel>
              <select
                id="babySelect"
                value={babyId}
                onChange={(e) => setBabyId(e.target.value)}
                className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 fill=%22none%22 stroke=%22%23f472b6%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:22px] bg-[right_1rem_center] bg-no-repeat pr-12`}
              >
                {babies.map((baby) => (
                  <option key={baby.id} value={baby.id}>
                    {baby.baby_name}
                  </option>
                ))}
              </select>
            </section>

            {/* ---------- สรุปวันนี้ ---------- */}
            <section>
              <h2 className="mb-3 px-1 text-[18px] font-bold text-slate-800" style={fontHead}>
                สรุปวันนี้
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-3xl bg-pink-50 border border-pink-100 p-4 text-center">
                  <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-white text-pink-500">
                    <BabyIcon size={20} />
                  </div>
                  <p className="text-[13px] text-slate-500">ให้นมวันนี้</p>
                  <p className="text-[30px] font-bold leading-tight text-pink-500" style={fontHead}>
                    {todayNursing}
                  </p>
                  <p className="text-[13px] text-slate-400">ครั้ง</p>
                </div>

                <div className="rounded-3xl bg-violet-50 border border-violet-100 p-4 text-center">
                  <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-white text-violet-500">
                    <Milk size={20} />
                  </div>
                  <p className="text-[13px] text-slate-500">ปั๊มนมวันนี้</p>
                  <p className="text-[30px] font-bold leading-tight text-violet-500" style={fontHead}>
                    {todayPumping.length}
                  </p>
                  <p className="text-[13px] text-slate-400">ครั้ง</p>
                </div>

                <div className="rounded-3xl bg-sky-50 border border-sky-100 p-4 text-center">
                  <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-white text-sky-500">
                    <Droplet size={20} />
                  </div>
                  <p className="text-[13px] text-slate-500">ปริมาณที่ปั๊ม</p>
                  <p className="text-[30px] font-bold leading-tight text-sky-500" style={fontHead}>
                    {totalMilk}
                  </p>
                  <p className="text-[13px] text-slate-400">ml</p>
                </div>
              </div>
            </section>

            {/* ---------- ฟอร์มบันทึก ---------- */}
            <section
              className={`rounded-3xl border-2 bg-white p-5 shadow-sm transition ${
                editingId !== null ? 'border-amber-200' : 'border-pink-100'
              }`}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-bold text-slate-800" style={fontHead}>
                  {editingId !== null ? 'แก้ไขรายการ' : 'บันทึกกิจกรรม'}
                </h2>
                {editingId !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[13px] font-semibold text-amber-700">
                    <Pencil size={14} />
                    กำลังแก้ไข
                  </span>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* ประเภท */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecordType('nursing')}
                    className={`flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-[17px] font-semibold transition active:scale-[0.97] ${
                      recordType === 'nursing'
                        ? 'bg-pink-50 border-pink-300 text-pink-600 shadow-sm'
                        : 'bg-white border-slate-100 text-slate-500'
                    }`}
                  >
                    <BabyIcon size={26} />
                    ให้นม
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordType('pumping')}
                    className={`flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-[17px] font-semibold transition active:scale-[0.97] ${
                      recordType === 'pumping'
                        ? 'bg-violet-50 border-violet-300 text-violet-600 shadow-sm'
                        : 'bg-white border-slate-100 text-slate-500'
                    }`}
                  >
                    <Milk size={26} />
                    ปั๊มนม
                  </button>
                </div>

                {recordType === 'nursing' && (
                  <div>
                    <FieldLabel>เต้านมที่ให้นม</FieldLabel>
                    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-pink-50 p-1.5">
                      {([
                        ['left', 'ซ้าย'],
                        ['right', 'ขวา'],
                        ['both', 'สองข้าง'],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFeedingSide(value)}
                          className={`h-12 rounded-xl text-[16px] font-semibold transition ${
                            feedingSide === value
                              ? 'bg-white text-pink-600 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <FieldLabel htmlFor="startedAt" icon={<CalendarClock size={20} />}>
                    วันที่และเวลา
                  </FieldLabel>
                  <input
                    id="startedAt"
                    type="datetime-local"
                    required
                    value={startedAt}
                    onChange={(e) => setStartedAt(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="duration" icon={<Timer size={20} />}>
                    ระยะเวลา (นาที)
                  </FieldLabel>
                  <input
                    id="duration"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="600"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="เช่น 20"
                    className={inputClass}
                  />
                </div>

                {recordType === 'pumping' && (
                  <div>
                    <FieldLabel htmlFor="amount" icon={<Droplet size={20} />}>
                      ปริมาณน้ำนมที่ปั๊มได้ (ml)
                    </FieldLabel>
                    <input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      min="0.1"
                      step="0.1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="เช่น 120"
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <FieldLabel htmlFor="notes" icon={<NotebookPen size={20} />}>
                    หมายเหตุ
                  </FieldLabel>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
                    rows={3}
                    className={`${inputClass} h-auto py-3 leading-relaxed`}
                  />
                </div>

                {message && (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-[16px] text-emerald-700">
                    <CheckCircle2 size={22} className="shrink-0" />
                    {message}
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-[16px] text-red-700">
                    <AlertCircle size={22} className="shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-rose-400 text-[18px] font-bold text-white shadow-[0_10px_25px_-8px_rgba(236,72,153,0.6)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
                  style={fontHead}
                >
                  {saving && <LoaderCircle size={20} className="animate-spin" />}
                  {saving
                    ? 'กำลังบันทึก...'
                    : editingId !== null
                      ? 'บันทึกการแก้ไข'
                      : 'บันทึกข้อมูล'}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white text-[17px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
                  >
                    <X size={20} />
                    ยกเลิกการแก้ไข
                  </button>
                )}
              </form>
            </section>

            {/* ---------- ประวัติ ---------- */}
            <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-[20px] font-bold text-slate-800" style={fontHead}>
                ประวัติการให้นมและปั๊มนม
              </h2>

              {selectedLogs.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-pink-50 text-pink-300">
                    <NotebookPen size={26} />
                  </div>
                  <p className="text-[16px] text-slate-400">ยังไม่มีประวัติการบันทึก</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedLogs.map((log) => {
                    const isNursing = log.record_type === 'nursing'
                    return (
                      <div
                        key={log.id}
                        className={`rounded-2xl border-2 p-4 transition ${
                          editingId === log.id
                            ? 'border-amber-200 bg-amber-50/40'
                            : 'border-slate-100 bg-[#FFFDFB]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                              isNursing ? 'bg-pink-100 text-pink-500' : 'bg-violet-100 text-violet-500'
                            }`}
                          >
                            {isNursing ? <BabyIcon size={24} /> : <Milk size={24} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[17px] font-bold text-slate-800" style={fontHead}>
                              {isNursing ? 'ให้นม' : 'ปั๊มนม'}
                              {isNursing && (
                                <span className="ml-2 rounded-full bg-pink-50 px-2.5 py-0.5 align-middle text-[13px] font-medium text-pink-600">
                                  {log.feeding_side === 'left'
                                    ? 'ซ้าย'
                                    : log.feeding_side === 'right'
                                      ? 'ขวา'
                                      : 'สองข้าง'}
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-slate-500">
                              <CalendarClock size={15} />
                              {formatDate(log.started_at)}
                            </p>
                          </div>
                        </div>

                        {(log.duration_minutes != null || log.amount_ml != null) && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[15px]">
                            {log.duration_minutes != null && (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-amber-700">
                                <Timer size={16} />
                                {log.duration_minutes} นาที
                              </span>
                            )}
                            {log.amount_ml != null && (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-sky-700">
                                <Droplet size={16} />
                                {log.amount_ml} ml
                              </span>
                            )}
                          </div>
                        )}

                        {log.notes && (
                          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[15px] leading-relaxed text-slate-600">
                            {log.notes}
                          </p>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => startEdit(log)}
                            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-50 text-[16px] font-semibold text-sky-700 transition hover:bg-sky-100 active:scale-[0.97] disabled:opacity-50"
                          >
                            <Pencil size={18} />
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleDelete(log)}
                            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-rose-50 text-[16px] font-semibold text-rose-600 transition hover:bg-rose-100 active:scale-[0.97] disabled:opacity-50"
                          >
                            <Trash2 size={18} />
                            ลบ
                          </button>
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
                ข้อมูลนี้ใช้สำหรับบันทึกกิจกรรมการให้นมเท่านั้น
                ไม่ใช่การประเมินว่าทารกได้รับน้ำนมเพียงพอหรือไม่
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FeedingTrackerPage