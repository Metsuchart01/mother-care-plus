import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Fingerprint,
  LoaderCircle,
  Search,
  SearchX,
  Users,
  Phone,
  UserRound,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export type Mother = {
  id: string
  full_name: string | null
  phone: string | null
  created_at: string
}

type Props = {
  onBack: () => void
  onSelectMother: (mother: Mother) => void
}

const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" }
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" }

export default function NurseMothersPage({
  onBack,
  onSelectMother,
}: Props) {
  const [mothers, setMothers] = useState<Mother[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadMothers() {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, created_at')
        .in(
          'id',
          (
            await supabase
              .from('user_roles')
              .select('user_id')
              .eq('role', 'mother')
          ).data?.map((item) => item.user_id) ?? []
        )
        .order('created_at', { ascending: false })

      if (error) throw error

      setMothers(data ?? [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถโหลดรายชื่อคุณแม่ได้'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMothers()
  }, [])

  const filteredMothers = mothers.filter((mother) => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return true

    return (
      (mother.full_name ?? '').toLowerCase().includes(keyword) ||
      (mother.phone ?? '').includes(keyword)
    )
  })

  return (
    <main className="min-h-screen bg-[#F7FAFC] pb-12 text-slate-700" style={fontBody}>
      {/* ---------- ส่วนหัว ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-sky-200 via-cyan-100 to-pink-100 px-4 pt-6 pb-14 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
        <div className="relative max-w-5xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-white/70 px-4 text-[16px] font-semibold text-sky-700 shadow-sm transition hover:bg-white active:scale-95"
          >
            <ArrowLeft size={20} />
            กลับหน้าหลักพยาบาล
          </button>

          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-sky-500 shadow-sm">
              <Users size={28} />
            </div>
            <div>
              <h1 className="text-[26px] font-bold leading-tight text-slate-800" style={fontHead}>
                รายชื่อคุณแม่
              </h1>
              <p className="text-[15px] text-slate-600">
                ค้นหาและเลือกคุณแม่เพื่อดูข้อมูลสุขภาพ
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-4 -mt-8">
        {/* ---------- ค้นหา ---------- */}
        <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(14,165,233,0.45)]">
          <div className="relative">
            <Search
              size={22}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-300"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหรือเบอร์โทรศัพท์..."
              aria-label="ค้นหาชื่อหรือเบอร์โทรศัพท์"
              className="h-14 w-full rounded-2xl border-2 border-sky-100 bg-[#FBFDFF] pl-12 pr-4 text-[17px] text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[15px] text-slate-500">
              พบคุณแม่{' '}
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-bold text-sky-600">
                {filteredMothers.length}
              </span>{' '}
              คน
            </p>

            <button
              type="button"
              onClick={() => void loadMothers()}
              disabled={loading}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-sky-100 px-4 text-[15px] font-semibold text-sky-600 transition hover:bg-sky-50 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
              โหลดใหม่
            </button>
          </div>
        </section>

        {/* ---------- กำลังโหลด ---------- */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-[16px] text-slate-500">
            <LoaderCircle size={36} className="animate-spin text-sky-400" />
            กำลังโหลดรายชื่อคุณแม่...
          </div>
        )}

        {/* ---------- ผิดพลาด ---------- */}
        {!loading && error && (
          <section role="alert" className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-5">
            <p className="flex items-center gap-2 text-[17px] font-bold text-red-700" style={fontHead}>
              <AlertCircle size={22} />
              โหลดข้อมูลไม่สำเร็จ
            </p>
            <p className="mt-2 break-words text-[15px] text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadMothers()}
              className="mt-4 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[16px] font-semibold text-red-600 shadow-sm transition active:scale-95"
            >
              <RefreshCw size={18} />
              ลองอีกครั้ง
            </button>
          </section>
        )}

        {/* ---------- ไม่พบ ---------- */}
        {!loading && !error && filteredMothers.length === 0 && (
          <section className="mt-5 rounded-3xl border border-sky-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky-50 text-sky-300">
              <SearchX size={30} />
            </div>
            <p className="mt-3 text-[17px] font-semibold text-slate-700">ไม่พบรายชื่อคุณแม่</p>
            <p className="mt-1 text-[15px] text-slate-400">ลองค้นหาด้วยชื่อหรือเบอร์โทรศัพท์อื่น</p>
          </section>
        )}

        {/* ---------- รายชื่อ ---------- */}
        {!loading && !error && filteredMothers.length > 0 && (
          <section className="mt-5 grid gap-3 md:grid-cols-2">
            {filteredMothers.map((mother) => (
              <button
                key={mother.id}
                type="button"
                onClick={() => onSelectMother(mother)}
                className="group w-full rounded-3xl border-2 border-transparent bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md active:scale-[0.98] sm:p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-100 to-sky-100 text-pink-500">
                    <UserRound size={28} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[18px] font-bold text-slate-800" style={fontHead}>
                      {mother.full_name?.trim() || 'ยังไม่ได้ระบุชื่อ'}
                    </h2>

                    <p className="mt-1 flex items-center gap-2 text-[15px] text-slate-500">
                      <Phone size={15} className="shrink-0 text-sky-400" />
                      {mother.phone || 'ยังไม่ได้ระบุเบอร์โทร'}
                    </p>

                    <p className="mt-1 flex items-center gap-2 text-[13px] text-slate-400">
                      <Fingerprint size={14} className="shrink-0" />
                      รหัสบัญชี: {mother.id.slice(0, 8)}...
                    </p>
                  </div>

                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-500 transition group-hover:bg-sky-100 group-hover:translate-x-0.5">
                    <ChevronRight size={22} />
                  </span>
                </div>
              </button>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}