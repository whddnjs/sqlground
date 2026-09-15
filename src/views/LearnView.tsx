import { Check, ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import { RunnableSql } from '../components/learn/RunnableSql'
import type { DbEngine, ExecOutcome } from '../db/engine'
import { CHAPTERS } from '../learn/content'
import { getLessonEngine, resetLessonEngine } from '../learn/lesson-engine'
import type { Lesson } from '../learn/types'
import { useEditorStore } from '../store/editor-store'
import { useLearnStore } from '../store/learn-store'
import { useUiStore } from '../store/ui-store'

const ALL_LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons)

export function LearnView() {
  const { completed, lastLesson, select, toggleCompleted } = useLearnStore()
  const appendCode = useEditorStore((s) => s.appendCode)
  const setView = useUiStore((s) => s.setView)
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState<DbEngine | null>(null)
  const [engineVersion, setEngineVersion] = useState(0)

  useEffect(() => {
    void getLessonEngine().then(setEngine)
  }, [])

  const current = ALL_LESSONS.find((l) => l.id === lastLesson) ?? ALL_LESSONS[0]
  const index = ALL_LESSONS.indexOf(current)
  const prev = ALL_LESSONS[index - 1]
  const next = ALL_LESSONS[index + 1]
  const done = completed.includes(current.id)

  const q = query.trim().toLowerCase()
  const visibleChapters = useMemo(
    () =>
      q === ''
        ? CHAPTERS
        : CHAPTERS.map((c) => ({
            ...c,
            lessons: c.lessons.filter((l) => l.title.toLowerCase().includes(q) || l.keywords.some((k) => k.toLowerCase().includes(q))),
          })).filter((c) => c.lessons.length > 0),
    [q],
  )

  const run = (sql: string): ExecOutcome => {
    if (!engine) return { results: [], error: { message: '학습용 DB 를 아직 불러오는 중입니다', sql } }
    return engine.exec(sql)
  }
  const openInPlayground = (sql: string) => {
    appendCode(sql)
    setView('playground')
  }
  const reset = async () => {
    setEngine(await resetLessonEngine())
    setEngineVersion((v) => v + 1)
  }

  return (
    <div className="flex h-full">
      <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-700">
        <div className="relative p-2">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="문법 찾기 (예: JOIN, NULL)"
            className="w-full rounded border border-neutral-300 bg-white py-1 pr-2 pl-7 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800"
          />
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {visibleChapters.map((c) => (
            <div key={c.id} className="mb-3">
              <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">{c.title}</p>
              <ul>
                {c.lessons.map((l) => {
                  const active = l.id === current.id
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => select(l.id)}
                        className={[
                          'flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm',
                          active ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                        ].join(' ')}
                      >
                        <span className={['flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]', completed.includes(l.id) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-300 dark:border-neutral-600'].join(' ')}>
                          {completed.includes(l.id) && <Check size={10} />}
                        </span>
                        <span className="truncate">{l.title}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {visibleChapters.length === 0 && <p className="px-2 text-sm text-neutral-500">검색 결과가 없습니다.</p>}
        </nav>
        <div className="border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700">
          {completed.length} / {ALL_LESSONS.length} 완료
        </div>
      </aside>

      <article className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-6">
          <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500">
            <span>
              {index + 1} / {ALL_LESSONS.length}
            </span>
            <button onClick={() => void reset()} title="학습용 DB 를 샘플 데이터 상태로 되돌립니다" className="ml-auto flex items-center gap-1 rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <RotateCcw size={12} /> 예제 DB 초기화
            </button>
          </div>
          <h1 className="mb-4 text-2xl font-semibold">{current.title}</h1>

          <div key={`${current.id}-${engineVersion}`} className="lesson-body">
            <Markdown
              components={{
                pre: ({ children }) => <>{children}</>,
                code: ({ className, children }) => {
                  const text = String(children).replace(/\n$/, '')
                  if (className === 'language-sql') return <RunnableSql initialSql={text} onRun={run} onOpenInPlayground={openInPlayground} />
                  if (className) return <pre className="my-4 overflow-x-auto rounded-md bg-neutral-100 p-3 font-mono text-[13px] dark:bg-neutral-800">{text}</pre>
                  return <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-neutral-800">{text}</code>
                },
              }}
            >
              {current.body}
            </Markdown>
          </div>

          <div className="mt-10 flex items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <button disabled={!prev} onClick={() => prev && select(prev.id)} className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800">
              <ChevronLeft size={16} /> {prev?.title ?? '이전'}
            </button>
            <button
              onClick={() => toggleCompleted(current.id)}
              className={['mx-auto flex items-center gap-1.5 rounded px-3 py-1.5 text-sm', done ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800'].join(' ')}
            >
              <Check size={14} /> {done ? '완료했어요' : '완료로 표시'}
            </button>
            <button disabled={!next} onClick={() => next && select(next.id)} className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800">
              {next?.title ?? '다음'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}
