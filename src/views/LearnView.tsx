import { Check, ChevronLeft, ChevronRight, ListChecks, RotateCcw, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Markdown, { type Components } from 'react-markdown'
import { RunnableSql } from '../components/learn/RunnableSql'
import type { DbEngine, ExecOutcome, TableInfo } from '../db/engine'
import { CHAPTERS } from '../learn/content'
import { LessonDbContext } from '../learn/lesson-db-context'
import { getLessonEngine, resetLessonEngine } from '../learn/lesson-engine'
import type { Lesson } from '../learn/types'
import { PROBLEMS } from '../problems/content'
import { useEditorStore } from '../store/editor-store'
import { useLearnStore } from '../store/learn-store'
import { useProblemStore } from '../store/problem-store'
import { useUiStore } from '../store/ui-store'

const ALL_LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons)

const schemaKey = (tables: TableInfo[]) => tables.map((t) => `${t.name}(${t.columns.map((c) => c.name).join(',')})`).join(';')

/**
 * 모듈 상수로 고정한다. 렌더마다 새 객체를 넘기면 react-markdown 이 예제 블록을 다시 마운트해
 * 실행 결과(state)가 사라진다. 바뀌는 값은 LessonDbContext 로 전달한다.
 */
const MARKDOWN_COMPONENTS: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const text = String(children).replace(/\n$/, '')
    if (className === 'language-sql') return <RunnableSql initialSql={text} />
    if (className) return <pre className="my-4 overflow-x-auto rounded-md bg-neutral-100 p-3 font-mono text-[13px] dark:bg-neutral-800">{text}</pre>
    return <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-neutral-800">{text}</code>
  },
}

export function LearnView() {
  const { completed, lastLesson, select, toggleCompleted } = useLearnStore()
  const appendCode = useEditorStore((s) => s.appendCode)
  const setView = useUiStore((s) => s.setView)
  const solved = useProblemStore((s) => s.solved)
  const selectProblem = useProblemStore((s) => s.select)
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState<DbEngine | null>(null)
  const [engineVersion, setEngineVersion] = useState(0)
  // 자동완성용 테이블 목록. 예제 실행으로 구조가 바뀌면 갱신
  const [tables, setTables] = useState<TableInfo[]>([])

  useEffect(() => {
    void getLessonEngine().then((e) => {
      setEngine(e)
      setTables(e.getTables())
    })
  }, [])

  const current = ALL_LESSONS.find((l) => l.id === lastLesson) ?? ALL_LESSONS[0]
  const index = ALL_LESSONS.indexOf(current)
  const prev = ALL_LESSONS[index - 1]
  const next = ALL_LESSONS[index + 1]
  const done = completed.includes(current.id)
  const relatedProblems = PROBLEMS.filter((p) => p.lessonId === current.id)

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
    const outcome = engine.exec(sql)
    // 구조가 실제로 바뀐 경우에만 갱신해 불필요한 다시 그리기를 막는다
    const next = engine.getTables()
    setTables((prev) => (schemaKey(prev) === schemaKey(next) ? prev : next))
    return outcome
  }
  const openInPlayground = (sql: string) => {
    appendCode(sql)
    setView('playground')
  }
  const reset = async () => {
    const e = await resetLessonEngine()
    setEngine(e)
    setTables(e.getTables())
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
            <LessonDbContext.Provider value={{ tables, run, openInPlayground }}>
              <Markdown components={MARKDOWN_COMPONENTS}>{current.body}</Markdown>
            </LessonDbContext.Provider>
          </div>

          {relatedProblems.length > 0 && (
            <section className="mt-10 rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <ListChecks size={15} /> 이 단원 문제 풀기
              </h2>
              <ul className="flex flex-col gap-1">
                {relatedProblems.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => {
                        selectProblem(p.id)
                        setView('problems')
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <span
                        className={[
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                          solved.includes(p.id) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-300 dark:border-neutral-600',
                        ].join(' ')}
                      >
                        {solved.includes(p.id) && <Check size={10} />}
                      </span>
                      <span className="flex-1">{p.title}</span>
                      <span className="text-xs text-neutral-400">{['', '쉬움', '보통', '어려움'][p.difficulty]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-6 flex items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
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
