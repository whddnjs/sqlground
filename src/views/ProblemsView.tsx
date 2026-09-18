import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { BookOpen, Check, ChevronLeft, ChevronRight, Eye, Lightbulb, Play, RotateCcw, Send, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { ResultGrid } from '../components/result/ResultGrid'
import type { AsyncDbEngine, ExecOutcome, TableInfo } from '../db/engine'
import { CHAPTERS } from '../learn/content'
import { LESSON_TIMEOUT_MS, getLessonEngine, resetLessonEngine } from '../learn/lesson-engine'
import { sqlExtensions } from '../lib/editor-schema'
import { explainSqlError } from '../lib/error-messages'
import { PROBLEMS } from '../problems/content'
import { grade, type GradeResult } from '../problems/grade'
import type { Problem } from '../problems/types'
import { useProblemStore } from '../store/problem-store'
import { useSettingsStore } from '../store/settings-store'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routes } from '../routes'

/** 단원 순서대로 문제를 묶는다. 문제가 없는 단원은 건너뛴다 */
const GROUPS = CHAPTERS.map((c) => ({
  chapter: c,
  lessons: c.lessons.map((l) => ({ lesson: l, problems: PROBLEMS.filter((p) => p.lessonId === l.id) })).filter((x) => x.problems.length > 0),
})).filter((g) => g.lessons.length > 0)

const ORDERED: Problem[] = GROUPS.flatMap((g) => g.lessons.flatMap((l) => l.problems))
const DIFFICULTY = { 1: '쉬움', 2: '보통', 3: '어려움' } as const

export function ProblemsView() {
  const { solved, drafts, lastProblem, select, saveDraft, markSolved } = useProblemStore()
  const navigate = useNavigate()
  const { problemId } = useParams()
  const fontSize = useSettingsStore((s) => s.fontSize)

  // 주소가 곧 현재 문제다. 주소에 문제가 없으면 마지막에 풀던 문제(없으면 첫 문제)로 보낸다
  const found = ORDERED.find((p) => p.id === problemId) ?? null
  const fallback = ORDERED.find((p) => p.id === lastProblem) ?? ORDERED[0]
  const current = found ?? fallback
  useEffect(() => {
    if (found) select(found.id)
  }, [found, select])
  const go = (id: string) => navigate(routes.problem(id))
  const index = ORDERED.indexOf(current)
  const prev = ORDERED[index - 1]
  const next = ORDERED[index + 1]
  const isSolved = solved.includes(current.id)

  const [engine, setEngine] = useState<AsyncDbEngine | null>(null)
  const [running, setRunning] = useState(false)
  // 자동완성용 테이블 목록. DB 가 준비되거나 초기화되거나 실행으로 구조가 바뀔 때 갱신
  const [tables, setTables] = useState<TableInfo[]>([])
  // 문제별 화면 상태. 문제가 바뀌면 렌더 중에 바로 새 상태로 바꾼다.
  // effect 로 초기화하면 그 사이에 들어온 입력이 지워지는 틈이 생긴다
  const fresh = (id: string) => ({ id, code: drafts[id] ?? '', outcome: null as ExecOutcome | null, verdict: null as GradeResult | null, showHint: false, showAnswer: false, attempts: 0 })
  const [ui, setUi] = useState(() => fresh(current.id))
  if (ui.id !== current.id) setUi(fresh(current.id))
  const { code, outcome, verdict, showHint, showAnswer, attempts } = ui
  const patch = (p: Partial<typeof ui>) => setUi((prev) => ({ ...prev, ...p }))

  const applyEngine = async (e: AsyncDbEngine) => {
    setEngine(e)
    setTables(await e.getTables())
  }
  useEffect(() => {
    void getLessonEngine().then(applyEngine)
    // 처음 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const codeRef = useRef(code)
  codeRef.current = code

  /**
   * 내 SQL 을 실행해 채점에 쓸 결과를 돌려준다.
   * 변경 문제는 스냅샷 → 실행 → 확인 쿼리 → 복원 순서라 몇 번을 실행해도 DB 가 그대로다.
   */
  const execute = async (sqlText: string): Promise<{ shown: ExecOutcome; graded: ExecOutcome | null } | null> => {
    if (!engine) return null
    const options = { timeoutMs: LESSON_TIMEOUT_MS }
    if (!current.checkSql) {
      const { outcome: o, tables: next } = await engine.exec(sqlText, options)
      setTables(next)
      return { shown: o, graded: o.error ? null : o }
    }
    const snapshot = await engine.export()
    const { outcome: o } = await engine.exec(sqlText, options)
    const check = o.error ? null : (await engine.exec(current.checkSql, options)).outcome
    // 중단됐다면 엔진이 이미 복구 지점으로 돌아가 있다. 그 위에 시작 상태를 다시 올린다
    await engine.import(snapshot)
    return { shown: o.error || !check ? o : check, graded: check }
  }

  const run = async () => {
    setRunning(true)
    try {
      const r = await execute(codeRef.current)
      if (r) patch({ outcome: r.shown })
      return r
    } finally {
      setRunning(false)
    }
  }

  const submit = async () => {
    const r = await run()
    if (!r || !engine) return
    setUi((prev) => ({ ...prev, attempts: prev.attempts + 1 }))
    const mineOutcome = r.graded
    if (!mineOutcome || mineOutcome.error || mineOutcome.results.length === 0) {
      patch({ verdict: { ok: false, message: r.shown.error ? '쿼리에 에러가 있습니다. 아래 메시지를 확인하세요.' : '결과가 없습니다. SQL 문을 작성하세요.' } })
      return
    }
    setRunning(true)
    const expected = await execute(current.answerSql).finally(() => setRunning(false))
    const expectedOutcome = expected?.graded
    if (!expectedOutcome || expectedOutcome.error || expectedOutcome.results.length === 0) {
      patch({ verdict: { ok: false, message: '정답을 계산할 수 없습니다. 예제 DB 를 초기화한 뒤 다시 시도하세요.' } })
      return
    }
    // 여러 문장을 실행했다면 마지막 조회 결과로 채점
    const lastQuery = (o: ExecOutcome) => [...o.results].reverse().find((x) => x.columns.length > 0) ?? o.results[o.results.length - 1]
    const g = grade(lastQuery(mineOutcome), lastQuery(expectedOutcome), current.orderMatters)
    patch({ verdict: g })
    if (g.ok) markSolved(current.id)
  }

  const extensions = useMemo(
    () => [
      ...sqlExtensions(tables),
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => (void run(), true) }, { key: 'Ctrl-Enter', run: () => (void run(), true) }])),
    ],
    // run 은 ref 와 현재 문제를 읽는다. 스키마나 문제가 바뀌면 다시 만든다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, tables, current.id],
  )

  const goLesson = () => navigate(routes.lesson(current.lessonId))
  const lessonTitle = CHAPTERS.flatMap((c) => c.lessons).find((l) => l.id === current.lessonId)?.title ?? ''

  if (!found) return <Navigate to={routes.problem(fallback.id)} replace />

  return (
    <div className="flex h-full gap-2">
      <aside className="card flex w-64 shrink-0 flex-col overflow-hidden">
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {GROUPS.map((g) => (
            <div key={g.chapter.id} className="mb-3">
              <p className="section-label px-2 pt-2 pb-1">{g.chapter.title}</p>
              {g.lessons.map((l) => (
                <ul key={l.lesson.id}>
                  {l.problems.map((p) => {
                    const active = p.id === current.id
                    const done = solved.includes(p.id)
                    return (
                      <li key={p.id}>
                        <button
                          onClick={() => go(p.id)}
                          className={[
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
                            active ? 'bg-accent-soft font-medium text-accent-fg' : 'text-fg hover:bg-hover',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]',
                              done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-line-strong',
                            ].join(' ')}
                          >
                            {done && <Check size={10} />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{p.title}</span>
                          <Difficulty level={p.difficulty} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-line px-3 py-2 text-xs text-fg-muted tabular-nums">
          {solved.length} / {ORDERED.length} 해결
        </div>
      </aside>

      <article className="card min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-6">
          <div className="mb-3 flex items-center gap-3 text-xs text-fg-muted">
            <span>
              {index + 1} / {ORDERED.length}
            </span>
            <span className="flex items-center gap-1">
              <Difficulty level={current.difficulty} /> {DIFFICULTY[current.difficulty]}
            </span>
            <button onClick={goLesson} className="flex items-center gap-1 rounded px-2 py-1 hover:bg-hover">
              <BookOpen size={12} /> 관련 단원: {lessonTitle}
            </button>
            <button
              onClick={() => void resetLessonEngine().then(applyEngine)}
              title="문제풀이용 DB 만 샘플 데이터 상태로 되돌립니다. 연습장의 내 작업은 그대로예요"
              className="ml-auto flex items-center gap-1 rounded px-2 py-1 hover:bg-hover"
            >
              <RotateCcw size={12} /> 샘플 데이터 되돌리기
            </button>
          </div>

          <h1 className="mb-3 flex items-center gap-2 text-[26px] font-bold tracking-tight">
            {current.title}
            {isSolved && <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">해결</span>}
          </h1>
          <div className="lesson-body mb-4">
            <Markdown
              components={{
                code: ({ children }) => <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[0.9em]">{String(children)}</code>,
              }}
            >
              {current.description}
            </Markdown>
          </div>
          {current.checkSql ? (
            <div className="mb-4 rounded border border-line bg-canvas p-3 text-xs text-fg-muted">
              <p>
                이 문제는 <strong>데이터를 바꾸는</strong> 문제입니다. 실행·제출하면 아래 확인 쿼리의 결과를 보여 주고 정답과 비교한 뒤,
                DB 를 <strong>원래대로 되돌립니다</strong>. 몇 번이든 다시 시도할 수 있습니다.
              </p>
              <pre className="mt-2 overflow-x-auto font-mono text-[11px] text-fg-muted">확인 쿼리: {current.checkSql}</pre>
            </div>
          ) : (
            <p className="mb-4 text-xs text-fg-muted">
              채점은 결과의 <strong>값</strong>만 비교합니다. 열 이름은 자유이고, {current.orderMatters ? '이 문제는 행 순서까지 맞아야 합니다.' : '행 순서는 상관없습니다.'}
            </p>
          )}

          <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
            <CodeMirror
              value={code}
              onChange={(v) => {
                patch({ code: v })
                saveDraft(current.id, v)
              }}
              extensions={extensions}
              theme="none"
              minHeight="120px"
              placeholder="여기에 SQL 을 작성하세요"
              basicSetup={{ foldGutter: false, highlightActiveLine: false }}
              style={{ fontSize }}
            />
            <div className="flex items-center gap-1 border-t border-line bg-subtle/60 px-2 py-1.5">
              {running ? (
                <button onClick={() => engine?.cancel()} className="btn btn-sm btn-danger">
                  <Square size={11} /> 중단
                </button>
              ) : (
                <button onClick={() => void run()} className="btn btn-sm btn-outline" title="Cmd/Ctrl + Enter">
                  <Play size={12} /> 실행
                </button>
              )}
              <button disabled={running} onClick={() => void submit()} className="btn btn-sm btn-primary">
                <Send size={12} /> 제출
              </button>
              <button onClick={() => patch({ showHint: !showHint })} className="btn btn-sm btn-ghost ml-auto">
                <Lightbulb size={12} /> 힌트
              </button>
              <button
                onClick={() => patch({ showAnswer: !showAnswer })}
                disabled={attempts === 0 && !isSolved}
                title={attempts === 0 && !isSolved ? '한 번 제출한 뒤에 볼 수 있습니다' : undefined}
                className="btn btn-sm btn-ghost"
              >
                <Eye size={12} /> 정답 보기
              </button>
            </div>
          </div>

          {showHint && (
            <p className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
              힌트: {current.hint}
            </p>
          )}
          {showAnswer && (
            <pre className="mt-3 overflow-x-auto rounded border border-line bg-canvas p-3 font-mono text-xs">{current.answerSql}</pre>
          )}
          {verdict && (
            <p
              className={[
                'mt-3 rounded border p-3 text-sm font-medium',
                verdict.ok
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
              ].join(' ')}
            >
              {verdict.message}
            </p>
          )}

          {outcome && (
            <div className="mt-4 flex flex-col gap-3 text-sm">
              {current.checkSql && !outcome.error && <p className="text-xs text-fg-muted">내 SQL 실행 후 확인 쿼리 결과</p>}
              {outcome.results.map((r, i) =>
                r.columns.length > 0 ? <ResultGrid key={i} result={r} /> : <p key={i} className="text-xs text-fg-muted">실행 완료 · {r.rowsAffected}행 영향</p>,
              )}
              {outcome.error && (
                <div className="rounded border border-red-300 bg-red-50 p-2 text-xs dark:border-red-800 dark:bg-red-950">
                  <p className="font-mono text-red-600 dark:text-red-400">{outcome.error.message}</p>
                  {explainSqlError(outcome.error.message) && <p className="mt-1 text-red-800 dark:text-red-200">{explainSqlError(outcome.error.message)}</p>}
                </div>
              )}
            </div>
          )}

          <div className="mt-10 flex items-center gap-2 border-t border-line pt-4">
            <button disabled={!prev} onClick={() => prev && go(prev.id)} className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-hover disabled:opacity-30">
              <ChevronLeft size={16} /> {prev?.title ?? '이전'}
            </button>
            <button disabled={!next} onClick={() => next && go(next.id)} className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-hover disabled:opacity-30">
              {next?.title ?? '다음'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}

function Difficulty({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex shrink-0 gap-0.5" title={DIFFICULTY[level]}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={['h-1.5 w-1.5 rounded-full', i <= level ? 'bg-amber-500' : 'bg-hover'].join(' ')} />
      ))}
    </span>
  )
}
