import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Search,
  LoaderCircle,
  GraduationCap,
  Circle,
  AlertCircle,
  RefreshCw,
  SearchX,
  LayoutGrid,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Props = {
  user: User
  onBack: () => void
  onOpenArticle: (id: number) => void
}

type Article = {
  id: number
  title: string
  category: string
  summary: string | null
  content: string
  cover_image: string | null
  reading_minutes: number | null
  published: boolean | null
  created_at: string
}

type FilterType = 'all' | 'completed' | 'incomplete'

const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" }
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" }

export default function KnowledgePage({
  user,
  onBack,
  onOpenArticle,
}: Props) {
  const [articles, setArticles] = useState<Article[]>([])
  const [completedIds, setCompletedIds] = useState<number[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ทั้งหมด')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadData()
  }, [user.id])

  async function loadData() {
    setLoading(true)
    setError('')

    const [articleResult, completedResult] = await Promise.all([
      supabase
        .from('knowledge_articles')
        .select(
          'id,title,category,summary,content,cover_image,reading_minutes,published,created_at'
        )
        .eq('published', true)
        .order('created_at', { ascending: false }),

      supabase
        .from('completed_articles')
        .select('article_id')
        .eq('user_id', user.id),
    ])

    if (articleResult.error) {
      setError('ไม่สามารถโหลดบทความได้: ' + articleResult.error.message)
    } else {
      setArticles((articleResult.data || []) as Article[])
    }

    if (completedResult.error) {
      setError(
        'ไม่สามารถโหลดสถานะการเรียนได้: ' +
          completedResult.error.message
      )
    } else {
      setCompletedIds(
        (completedResult.data || []).map(
          (item) => item.article_id
        )
      )
    }

    setLoading(false)
  }

  const categories = useMemo(() => {
    return [
      'ทั้งหมด',
      ...Array.from(
        new Set(articles.map((article) => article.category))
      ),
    ]
  }, [articles])

  const completedCount = articles.filter((article) =>
    completedIds.includes(article.id)
  ).length

  const progress =
    articles.length > 0
      ? Math.round((completedCount / articles.length) * 100)
      : 0

  const filteredArticles = articles.filter((article) => {
    const isCompleted = completedIds.includes(article.id)

    const matchFilter =
      filter === 'all' ||
      (filter === 'completed' && isCompleted) ||
      (filter === 'incomplete' && !isCompleted)

    const matchCategory =
      category === 'ทั้งหมด' || article.category === category

    const keyword = search.toLowerCase()

    const matchSearch =
      article.title.toLowerCase().includes(keyword) ||
      (article.summary || '').toLowerCase().includes(keyword)

    return matchFilter && matchCategory && matchSearch
  })

  const filterButtons: {
    key: FilterType
    label: string
    count: number
    icon: typeof BookOpen
    active: string
    iconTone: string
  }[] = [
    {
      key: 'all',
      label: 'ทั้งหมด',
      count: articles.length,
      icon: BookOpen,
      active: 'bg-pink-50 border-pink-300',
      iconTone: 'bg-pink-100 text-pink-500',
    },
    {
      key: 'completed',
      label: 'เรียนแล้ว',
      count: completedCount,
      icon: CheckCircle,
      active: 'bg-emerald-50 border-emerald-300',
      iconTone: 'bg-emerald-100 text-emerald-500',
    },
    {
      key: 'incomplete',
      label: 'ยังไม่ได้เรียน',
      count: articles.length - completedCount,
      icon: Circle,
      active: 'bg-orange-50 border-orange-300',
      iconTone: 'bg-orange-100 text-orange-500',
    },
  ]

  return (
    <main className="min-h-screen bg-[#FFF8F3] pb-12 text-slate-700" style={fontBody}>
      {/* ---------- ส่วนหัว ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-orange-100 via-pink-100 to-sky-100 px-4 pt-6 pb-14 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
        <div className="relative max-w-5xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-white/70 px-4 text-[16px] font-semibold text-orange-700 shadow-sm transition hover:bg-white active:scale-95"
          >
            <ArrowLeft size={20} />
            กลับหน้าหลัก
          </button>

          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm">
              <GraduationCap size={30} />
            </div>
            <div>
              <h1 className="text-[26px] font-bold leading-tight text-slate-800" style={fontHead}>
                ความรู้หลังคลอด
              </h1>
              <p className="text-[15px] text-slate-600">
                เรียนรู้และติดตามความก้าวหน้าของคุณแม่
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-4 -mt-8 space-y-5">
        {/* ---------- ความคืบหน้า ---------- */}
        <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(236,72,153,0.4)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[15px] text-slate-500">ความคืบหน้าการเรียนของคุณแม่</p>
              <h2 className="mt-1 text-[36px] font-bold leading-none text-pink-500" style={fontHead}>
                {progress}
                <span className="text-[22px]">%</span>
              </h2>
            </div>

            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-100 to-orange-100 text-pink-500">
              <BookOpen size={28} />
            </div>
          </div>

          <div
            className="mt-4 h-4 w-full overflow-hidden rounded-full bg-pink-50"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-300 via-pink-400 to-orange-300 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between text-[14px] text-slate-500">
            <span>
              เรียนแล้ว <span className="font-bold text-slate-700">{completedCount}</span> บทความ
            </span>
            <span>
              ทั้งหมด <span className="font-bold text-slate-700">{articles.length}</span> บทความ
            </span>
          </div>
        </section>

        {/* ---------- ตัวกรองสถานะ ---------- */}
        <div className="grid grid-cols-3 gap-2.5">
          {filterButtons.map((item) => {
            const Icon = item.icon
            const isActive = filter === item.key
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(item.key)}
                className={`rounded-3xl border-2 p-3 text-center transition active:scale-[0.97] ${
                  isActive ? `${item.active} shadow-sm` : 'bg-white border-transparent shadow-sm'
                }`}
              >
                <span className={`mx-auto grid h-10 w-10 place-items-center rounded-xl ${item.iconTone}`}>
                  <Icon size={20} />
                </span>
                <p className="mt-1.5 text-[24px] font-bold leading-tight text-slate-800" style={fontHead}>
                  {item.count}
                </p>
                <p className="text-[13px] text-slate-500">{item.label}</p>
              </button>
            )
          })}
        </div>

        {/* ---------- ค้นหา ---------- */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pink-300"
            size={22}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาบทความ..."
            aria-label="ค้นหาบทความ"
            className="h-14 w-full rounded-2xl border-2 border-pink-100 bg-white pl-12 pr-4 text-[17px] text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
          />
        </div>

        {/* ---------- หมวดหมู่ ---------- */}
        <div>
          <p className="mb-3 flex items-center gap-2 px-1 text-[17px] font-bold text-slate-700" style={fontHead}>
            <LayoutGrid size={19} className="text-pink-400" />
            หมวดหมู่ความรู้
          </p>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`h-11 shrink-0 rounded-full px-5 text-[15px] font-semibold transition active:scale-95 ${
                  category === item
                    ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-md'
                    : 'border-2 border-pink-100 bg-white text-slate-600 hover:border-pink-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- รายการบทความ ---------- */}
        <section>
          <h2 className="mb-4 px-1 text-[20px] font-bold text-slate-800" style={fontHead}>
            บทความสำหรับคุณแม่
          </h2>

          {loading ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-12 border border-pink-100">
              <LoaderCircle className="animate-spin text-pink-400" size={34} />
              <p className="text-[16px] text-slate-500">กำลังโหลดบทความ...</p>
            </div>
          ) : error ? (
            <div role="alert" className="rounded-3xl border border-red-100 bg-red-50 p-5 text-[15px] text-red-700">
              <p className="flex items-start gap-3">
                <AlertCircle size={22} className="shrink-0" />
                {error}
              </p>
              <button
                type="button"
                onClick={loadData}
                className="mt-4 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[16px] font-semibold text-red-600 shadow-sm transition active:scale-95"
              >
                <RefreshCw size={18} />
                ลองอีกครั้ง
              </button>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="rounded-3xl border border-pink-100 bg-white p-8 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pink-50 text-pink-300">
                <SearchX size={30} />
              </div>
              <p className="mt-3 text-[17px] text-slate-500">ไม่พบบทความที่ต้องการ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredArticles.map((article) => {
                const isCompleted = completedIds.includes(article.id)

                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => onOpenArticle(article.id)}
                    className="group overflow-hidden rounded-3xl border border-pink-50 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="relative">
                      {article.cover_image ? (
                        <img
                          src={article.cover_image}
                          alt={article.title}
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-pink-100 via-orange-50 to-sky-100">
                          <BookOpen size={46} className="text-pink-300" />
                        </div>
                      )}

                      {isCompleted && (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-emerald-600 shadow-sm">
                          <CheckCircle size={14} />
                          เรียนแล้ว
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-pink-50 px-3 py-1 text-[13px] font-semibold text-pink-600">
                          {article.category}
                        </span>

                        {!isCompleted && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[13px] text-slate-500">
                            ยังไม่ได้เรียน
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-[18px] font-bold leading-snug text-slate-800" style={fontHead}>
                        {article.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-slate-500">
                        {article.summary || 'อ่านรายละเอียดบทความ'}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-dashed border-pink-100 pt-3">
                        <span className="flex items-center gap-1.5 text-[14px] text-slate-400">
                          <Clock size={15} />
                          {article.reading_minutes || '-'} นาที
                        </span>

                        <span className="flex items-center gap-1 text-[15px] font-semibold text-pink-500">
                          อ่านบทความ
                          <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <div className="py-4 text-center">
          <p className="text-[13px] font-semibold tracking-wide text-slate-400" style={fontHead}>
            MOTHER CARE PLUS
          </p>
          <p className="mt-1 text-[14px] text-slate-400">
            เรียนรู้วันละนิด เพื่อสุขภาพที่ดีของคุณแม่และลูกน้อย
          </p>
        </div>
      </div>
    </main>
  )
}