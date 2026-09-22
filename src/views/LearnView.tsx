import { Check, ChevronLeft, ChevronRight, ListChecks, Menu, RotateCcw, Search } from 'lucide-react'
import { SideList } from '../components/layout/SideList'
import { useEffect, useMemo, useState } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { RunnableSql } from '../components/learn/RunnableSql'
import type { AsyncDbEngine, ExecOutcome, TableInfo } from '../db/engine'
import { CHAPTERS } from '../learn/content'
import { LessonDbContext } from '../learn/lesson-db-context'
import { LESSON_TIMEOUT_MS, getLessonEngine, resetLessonEngine } from '../learn/lesson-engine'
import { searchLessons, type LessonHit } from '../learn/search'
import type { Lesson } from '../learn/types'
import { PROBLEMS } from '../problems/content'
import type { Problem } from '../problems/types'
import { useEditorStore } from '../store/editor-store'
import { useLearnStore } from '../store/learn-store'
import { useProblemStore } from '../store/problem-store'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routes } from '../routes'

const ALL_LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons)
/** 현재 단원 항목이 목록 밖에 있으면 그 자리까지만 스크롤한다 (ref 콜백) */
const scrollActiveIntoView = (el: HTMLLIElement | null) => el?.scrollIntoView({ block: 'nearest' })
// 본문의 | 표 | 는 GFM 문법이라 플러그인이 있어야 표로 그려진다. components 처럼 상수로 고정한다
const REMARK_PLUGINS = [remarkGfm]

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
    if (className) return <pre className="my-4 overflow-x-auto rounded-md bg-subtle p-3 font-mono text-[13px]">{text}</pre>
    return <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[0.9em]">{text}</code>
  },
}

export function LearnView() {
  const { completed, lastLesson, select, toggleCompleted } = useLearnStore()
  const appendCode = useEditorStore((s) => s.appendCode)
  const navigate = useNavigate()
  const { lessonId } = useParams()
  const solved = useProblemStore((s) => s.solved)
  const [query, setQuery] = useState('')
  // 폰 폭에서 단원 목록을 열었는지
  const [menuOpen, setMenuOpen] = useState(false)
  const [engine, setEngine] = useState<AsyncDbEngine | null>(null)
  const [engineVersion, setEngineVersion] = useState(0)
  // 자동완성용 테이블 목록. 예제 실행으로 구조가 바뀌면 갱신
  const [tables, setTables] = useState<TableInfo[]>([])

  useEffect(() => {
    void getLessonEngine().then(async (e) => {
      setEngine(e)
      setTables(await e.getTables())
    })
  }, [])

  // 주소가 곧 현재 단원이다. 주소에 단원이 없으면 마지막에 보던 단원(없으면 첫 단원)으로 보낸다
  const current = ALL_LESSONS.find((l) => l.id === lessonId) ?? null
  const fallback = ALL_LESSONS.find((l) => l.id === lastLesson) ?? ALL_LESSONS[0]
  useEffect(() => {
    if (current) select(current.id)
  }, [current, select])
  const shown = current ?? fallback
  const index = ALL_LESSONS.indexOf(shown)
  const prev = ALL_LESSONS[index - 1]
  const next = ALL_LESSONS[index + 1]
  const done = completed.includes(shown.id)
  const relatedProblems = PROBLEMS.filter((p) => p.lessonId === shown.id && !p.mixes)
  // 장의 마지막 단원이면 그 장의 종합 문제도 같이 보여 준다
  const chapter = CHAPTERS.find((c) => c.lessons.includes(shown))!
  const chapterLessonIds = new Set(chapter.lessons.map((l) => l.id))
  const mixedProblems = chapter.lessons[chapter.lessons.length - 1] === shown ? PROBLEMS.filter((p) => p.mixes && chapterLessonIds.has(p.lessonId)) : []
  const go = (id: string) => {
    setMenuOpen(false)
    void navigate(routes.lesson(id))
  }

  // 제목·키워드·본문을 찾는다. 본문에서만 맞은 단원은 맞은 곳을 한 줄 보여 준다
  const visibleChapters = useMemo(
    () =>
      CHAPTERS.map((c) => ({ id: c.id, title: c.title, hits: searchLessons(c.lessons, query) as LessonHit[] })).filter((c) => c.hits.length > 0),
    [query],
  )

  // 데이터를 바꾸는 예제를 실행한 적이 있는지. 되돌리기 버튼을 강조하는 데 쓴다
  const [dirty, setDirty] = useState(false)

  const run = async (sql: string): Promise<{ outcome: ExecOutcome; changed: boolean }> => {
    if (!engine) return { outcome: { results: [], error: { message: '학습용 DB 를 아직 불러오는 중입니다', sql } }, changed: false }
    const { outcome, tables: next, changed } = await engine.exec(sql, { timeoutMs: LESSON_TIMEOUT_MS })
    if (changed) setDirty(true)
    // 구조가 실제로 바뀐 경우에만 갱신해 불필요한 다시 그리기를 막는다
    setTables((prev) => (schemaKey(prev) === schemaKey(next) ? prev : next))
    if (outcome.interrupted) {
      return { outcome: { ...outcome, error: { ...outcome.error!, message: `${outcome.error!.message} 학습용 DB 는 샘플 데이터 상태로 돌아갔습니다.` } }, changed: false }
    }
    return { outcome, changed }
  }
  const openInPlayground = (sql: string) => {
    appendCode(sql)
    void navigate(routes.playground)
  }
  const reset = async () => {
    const e = await resetLessonEngine()
    setEngine(e)
    setTables(await e.getTables())
    setDirty(false)
    setEngineVersion((v) => v + 1)
  }

  if (!current) return <Navigate to={routes.lesson(fallback.id)} replace />

  return (
    <div className="flex h-full gap-2">
      <SideList open={menuOpen} onClose={() => setMenuOpen(false)} title="단원 목록">
        <div className="relative p-2">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="찾기 (예: JOIN, 페이징, 만 나이)"
            className="input pl-7"
          />
        </div>
        <nav aria-label="단원" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {visibleChapters.map((c) => (
            <div key={c.id} className="mb-3">
              <p className="section-label px-2 pt-2 pb-1">{c.title}</p>
              <ul>
                {c.hits.map(({ lesson: l, snippet }) => {
                  const active = l.id === shown.id
                  return (
                    <li key={l.id} ref={active ? scrollActiveIntoView : undefined}>
                      <button
                        onClick={() => go(l.id)}
                        className={[
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
                          active ? 'bg-accent-soft font-medium text-accent-fg' : 'text-fg hover:bg-hover',
                        ].join(' ')}
                      >
                        <span className={['flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]', completed.includes(l.id) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-line-strong'].join(' ')}>
                          {completed.includes(l.id) && <Check size={10} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{l.title}</span>
                          {snippet && <span className="block truncate text-[11px] font-normal text-fg-subtle">{snippet}</span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {visibleChapters.length === 0 && <p className="px-2 text-sm text-fg-muted">검색 결과가 없습니다.</p>}
        </nav>
        <div className="border-t border-line px-3 py-2 text-xs text-fg-muted tabular-nums">
          {completed.length} / {ALL_LESSONS.length} 완료
        </div>
      </SideList>

      <article className="card min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-4 md:px-8 md:py-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <button onClick={() => setMenuOpen(true)} className="btn btn-sm btn-ghost md:hidden">
              <Menu size={13} /> 단원 목록
            </button>
            <span>
              {index + 1} / {ALL_LESSONS.length}
            </span>
            <button
              onClick={() => void reset()}
              title="학습 예제용 DB 만 샘플 데이터 상태로 되돌립니다. 연습장의 내 작업은 그대로예요"
              className={['btn btn-sm ml-auto', dirty ? 'border border-amber-500/50 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-300' : 'btn-ghost'].join(' ')}
            >
              <RotateCcw size={12} /> 샘플 데이터 되돌리기
              {dirty && <span className="ml-0.5 text-[10px] font-normal">· 데이터가 바뀌었어요</span>}
            </button>
          </div>
          <h1 className="mb-5 text-[22px] font-bold tracking-tight md:text-[26px]">{shown.title}</h1>

          <div key={`${shown.id}-${engineVersion}`} className="lesson-body">
            <LessonDbContext.Provider value={{ tables, run, cancel: () => engine?.cancel(), openInPlayground }}>
              <Markdown components={MARKDOWN_COMPONENTS} remarkPlugins={REMARK_PLUGINS}>{shown.body}</Markdown>
            </LessonDbContext.Provider>
          </div>

          {relatedProblems.length > 0 && <ProblemLinks title="이 단원 문제 풀기" problems={relatedProblems} solved={solved} onOpen={(id) => void navigate(routes.problem(id))} />}
          {mixedProblems.length > 0 && (
            <ProblemLinks title={`${chapter.title} 종합 문제`} description="이 장의 여러 단원을 섞어 푸는 문제입니다." problems={mixedProblems} solved={solved} onOpen={(id) => void navigate(routes.problem(id))} />
          )}

          <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
            <button disabled={!prev} onClick={() => prev && go(prev.id)} className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-hover disabled:opacity-30">
              <ChevronLeft size={16} /> {prev?.title ?? '이전'}
            </button>
            <button
              onClick={() => toggleCompleted(shown.id)}
              className={['btn mx-auto', done ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'btn-outline'].join(' ')}
            >
              <Check size={14} /> {done ? '완료했어요' : '완료로 표시'}
            </button>
            <button disabled={!next} onClick={() => next && go(next.id)} className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-hover disabled:opacity-30">
              {next?.title ?? '다음'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}

function ProblemLinks({ title, description, problems, solved, onOpen }: { title: string; description?: string; problems: Problem[]; solved: string[]; onOpen(id: string): void }) {
  return (
    <section className="mt-6 rounded-md border border-line p-4">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <ListChecks size={15} /> {title}
      </h2>
      {description && <p className="mb-2 text-xs text-fg-muted">{description}</p>}
      <ul className="flex flex-col gap-1">
        {problems.map((p) => (
          <li key={p.id}>
            <button onClick={() => onOpen(p.id)} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-hover">
              <span
                className={[
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  solved.includes(p.id) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-line-strong',
                ].join(' ')}
              >
                {solved.includes(p.id) && <Check size={10} />}
              </span>
              <span className="flex-1">{p.title}</span>
              <span className="text-xs text-fg-subtle">{['', '쉬움', '보통', '어려움'][p.difficulty]}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
