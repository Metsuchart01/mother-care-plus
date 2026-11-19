import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  LoaderCircle,
  GraduationCap,
  AlertCircle,
  PlayCircle,
  RefreshCw,
  FileText,
  Tag,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Props = {
  user: User
  articleId: number
  onBack: () => void
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
  youtube_url: string | null
}

function getYoutubeId(content: string): string | null {
  const match = content.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )

  return match ? match[1] : null
}

function getYouTubeEmbedUrl(url: string | null) {
  if (!url) return null

  try {
    const parsed = new URL(url)

    let videoId = ''

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1)
    } else if (
      parsed.hostname.includes('youtube.com') ||
      parsed.hostname.includes('youtube-nocookie.com')
    ) {
      videoId =
        parsed.searchParams.get('v') ||
        parsed.pathname.split('/embed/')[1]?.split('/')[0] ||
        parsed.pathname.split('/shorts/')[1]?.split('/')[0] ||
        ''
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return null
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}`
  } catch {
    return null
  }
}

const fontBody = { fontFamily: "'Sarabun', 'Prompt', sans-serif" }
const fontHead = { fontFamily: "'Prompt', 'Sarabun', sans-serif" }

function SectionTitle({ icon, children, tone = 'text-pink-500 bg-pink-50' }: {
  icon: React.ReactNode
  children: React.ReactNode
  tone?: string
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</span>
      <h3 className="text-[18px] font-bold text-slate-800" style={fontHead}>
        {children}
      </h3>
    </div>
  )
}

export default function KnowledgeDetailPage({
  user,
  articleId,
  onBack,
}: Props) {
  const [article, setArticle] = useState<Article | null>(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void loadArticle()
  }, [articleId, user.id])

  async function loadArticle() {
    setLoading(true)
    setError('')
    setSuccess('')

    const [articleResult, completedResult] = await Promise.all([
      supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', articleId)
        .eq('published', true)
        .maybeSingle(),

      supabase
        .from('completed_articles')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .maybeSingle(),
    ])

    if (articleResult.error) {
      setError('ไม่สามารถโหลดบทความได้: ' + articleResult.error.message)
    } else if (!articleResult.data) {
      setError('ไม่พบบทความนี้ หรือบทความยังไม่ได้เผยแพร่')
    } else {
      setArticle(articleResult.data as Article)
    }

    if (completedResult.error) {
      setError(
        'ไม่สามารถตรวจสอบสถานะการเรียนได้: ' +
          completedResult.error.message
      )
    } else {
      setCompleted(!!completedResult.data)
    }

    setLoading(false)
  }

  async function toggleCompleted() {
    if (!article || saving) return

    setSaving(true)
    setError('')
    setSuccess('')

    if (!completed) {
      const { error } = await supabase
        .from('completed_articles')
        .insert({
          user_id: user.id,
          article_id: article.id,
        })

      if (error) {
        setError('บันทึกสถานะไม่สำเร็จ: ' + error.message)
      } else {
        setCompleted(true)
        setSuccess('ยินดีด้วยค่ะ! คุณแม่เรียนบทความนี้เรียบร้อยแล้ว')
      }
    } else {
      const { error } = await supabase
        .from('completed_articles')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', article.id)

      if (error) {
        setError('ยกเลิกสถานะไม่สำเร็จ: ' + error.message)
      } else {
        setCompleted(false)
        setSuccess('ยกเลิกสถานะเรียนแล้วเรียบร้อย')
      }
    }

    setSaving(false)
  }

  const backButton = (variant: 'light' | 'solid') => (
    <button
      type="button"
      onClick={onBack}
      className={`inline-flex h-12 items-center gap-2 rounded-2xl px-4 text-[16px] font-semibold shadow-sm transition active:scale-95 ${
        variant === 'light'
          ? 'bg-white/70 text-orange-700 hover:bg-white'
          : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
      }`}
    >
      <ArrowLeft size={20} />
      กลับหน้าความรู้
    </button>
  )

  if (loading) {
    return (
      <main
        className="min-h-screen bg-[#FFF8F3] flex items-center justify-center"
        style={fontBody}
      >
        <div className="text-center">
          <LoaderCircle className="animate-spin text-pink-400 mx-auto" size={38} />
          <p className="text-[17px] text-slate-500 mt-3">กำลังโหลดบทความ...</p>
        </div>
      </main>
    )
  }

  if (error && !article) {
    return (
      <main className="min-h-screen bg-[#FFF8F3] p-4 pt-6" style={fontBody}>
        <div className="max-w-3xl mx-auto rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
          {backButton('solid')}

          <div className="mt-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-400">
              <AlertCircle size={32} />
            </div>
            <p role="alert" className="mt-4 text-[17px] leading-relaxed text-rose-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadArticle}
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-pink-100 px-6 text-[16px] font-semibold text-pink-600 transition hover:border-pink-200 active:scale-95"
            >
              <RefreshCw size={18} />
              ลองอีกครั้ง
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (!article) return null

  const youtubeId = getYoutubeId(article.content)
  const embedUrl = getYouTubeEmbedUrl(article.youtube_url)

  return (
    <main className="min-h-screen bg-[#FFF8F3] pb-12 text-slate-700" style={fontBody}>
      {/* ---------- ส่วนหัว ---------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-orange-100 via-pink-100 to-sky-100 px-4 pt-6 pb-14 rounded-b-[2.5rem]">
        <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
        <div className="relative max-w-3xl mx-auto">
          <div className="mb-5">{backButton('light')}</div>

          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm">
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-[14px] font-semibold tracking-wide text-orange-700/80" style={fontHead}>
                MOTHER CARE <span className="text-sky-600">PLUS</span>
              </p>
              <h1 className="text-[24px] font-bold leading-tight text-slate-800" style={fontHead}>
                อ่านบทความความรู้
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-3xl mx-auto px-4 -mt-8 space-y-5">
        {/* ---------- บทความ ---------- */}
        <article className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-[0_16px_40px_-24px_rgba(236,72,153,0.4)]">
          {article.cover_image && (
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full max-h-80 object-cover"
            />
          )}

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1.5 text-[14px] font-semibold text-pink-600">
                <Tag size={14} />
                {article.category}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-[14px] text-sky-700">
                <Clock size={14} />
                {article.reading_minutes || '-'} นาที
              </span>

              {completed && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[14px] font-semibold text-emerald-700">
                  <CheckCircle size={14} />
                  เรียนแล้ว
                </span>
              )}
            </div>

            <h2 className="mt-4 text-[24px] font-bold leading-snug text-slate-800" style={fontHead}>
              {article.title}
            </h2>

            {/* วิดีโอจาก youtube_url */}
            {article.youtube_url && (
              <div className="mt-6">
                <SectionTitle icon={<PlayCircle size={22} />} tone="bg-rose-50 text-rose-500">
                  วิดีโอประกอบบทเรียน
                </SectionTitle>

                {embedUrl ? (
                  <div className="aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-md">
                    <iframe
                      src={embedUrl}
                      title={article.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                ) : (
                  <p className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-[15px] text-rose-600">
                    <AlertCircle size={18} className="shrink-0" />
                    ลิงก์วิดีโอไม่ถูกต้อง กรุณาตรวจสอบ URL
                  </p>
                )}
              </div>
            )}

            {article.summary && (
              <p className="mt-5 rounded-2xl border-l-4 border-orange-200 bg-orange-50/60 px-4 py-3 text-[16px] leading-relaxed text-slate-600">
                {article.summary}
              </p>
            )}

            <div className="my-6 border-t border-dashed border-pink-100" />

            {/* วิดีโอจากลิงก์ในเนื้อหา */}
            {youtubeId && (
              <section className="mb-7">
                <SectionTitle icon={<PlayCircle size={22} />} tone="bg-rose-50 text-rose-500">
                  วิดีโอประกอบบทเรียน
                </SectionTitle>

                <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-md">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                    title={article.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>

                <p className="mt-2 text-[13px] text-slate-400">
                  หากวิดีโอไม่สามารถเล่นได้ อาจเกิดจากเจ้าของวิดีโอจำกัดการฝังวิดีโอ
                </p>
              </section>
            )}

            {/* เนื้อหา */}
            <section>
              <SectionTitle icon={<FileText size={20} />} tone="bg-orange-50 text-orange-500">
                เนื้อหาบทเรียน
              </SectionTitle>

              <div className="whitespace-pre-wrap break-words text-[17px] leading-[1.9] text-slate-700">
                {article.content}
              </div>
            </section>
          </div>
        </article>

        {/* ---------- สถานะการเรียน ---------- */}
        <section
          className={`rounded-3xl border-2 bg-white p-5 shadow-sm transition ${
            completed ? 'border-emerald-100' : 'border-orange-100'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${
                completed ? 'bg-emerald-100 text-emerald-500' : 'bg-orange-100 text-orange-500'
              }`}
            >
              {completed ? <CheckCircle size={28} /> : <GraduationCap size={28} />}
            </div>

            <div className="flex-1">
              <h3 className="text-[18px] font-bold text-slate-800" style={fontHead}>
                สถานะการเรียน
              </h3>
              <p className={`mt-0.5 text-[15px] ${completed ? 'text-emerald-600' : 'text-slate-500'}`}>
                {completed
                  ? 'คุณแม่เรียนบทความนี้แล้ว'
                  : 'คุณแม่ยังไม่ได้ทำเครื่องหมายว่าเรียนแล้ว'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleCompleted}
            disabled={saving}
            className={`mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-bold transition active:scale-[0.98] disabled:opacity-60 ${
              completed
                ? 'border-2 border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-[0_10px_25px_-8px_rgba(16,185,129,0.6)] hover:brightness-105'
            }`}
            style={fontHead}
          >
            {saving ? (
              <>
                <LoaderCircle className="animate-spin" size={20} />
                กำลังบันทึก...
              </>
            ) : completed ? (
              <>
                <Circle size={20} />
                ยกเลิกสถานะเรียนแล้ว
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                ทำเครื่องหมายว่าเรียนแล้ว
              </>
            )}
          </button>

          {success && (
            <div
              role="status"
              className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-[15px] text-emerald-700"
            >
              <CheckCircle size={20} className="shrink-0" />
              {success}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-[15px] text-red-700"
            >
              <AlertCircle size={20} className="shrink-0" />
              {error}
            </div>
          )}
        </section>

        <div className="flex flex-col items-center gap-2 py-3 text-center text-[14px] text-slate-400">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-50 text-orange-300">
            <GraduationCap size={20} />
          </span>
          เรียนรู้เพื่อการดูแลสุขภาพคุณแม่และลูกน้อย
        </div>
      </div>
    </main>
  )
}