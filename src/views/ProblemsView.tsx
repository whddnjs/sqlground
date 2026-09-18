import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { BookOpen, Check, ChevronLeft, ChevronRight, CircleCheck, CircleX, Eye, GraduationCap, Lightbulb, Play, RotateCcw, Send, Square, Target, TerminalSquare } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { ExpectedResult } from '../components/problems/ExpectedResult'
import { ProblemContext } from '../components/problems/ProblemContext'
import { SectionPanel } from '../components/problems/SectionPanel'
import { SolutionPanel } from '../components/problems/SolutionPanel'
import { ResultGrid } from '../components/result/ResultGrid'
import type { AsyncDbEngine, ExecOutcome, QueryResult, TableInfo } from '../db/engine'
import { CHAPTERS } from '../learn/content'
import { LESSON_TIMEOUT_MS, getLessonEngine, resetLessonEngine } from '../learn/lesson-engine'
import { sqlExtensions } from '../lib/editor-schema'
import { explainSqlError } from '../lib/error-messages'
import { PROBLEMS } from '../problems/content'
import { expectedMeta, lastQueryResult, loadTablePreviews, relatedTables, type TablePreview } from '../problems/context'
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
  const fresh = (id: string) => ({ id, code: drafts[id] ?? '', outcome: null as ExecOutcome | null, verdict: null as GradeResult | null, showHint: false, showExpected: false, showAnswer: false })
  const [ui, setUi] = useState(() => fresh(current.id))
  if (ui.id !== current.id) setUi(fresh(current.id))
  const { code, outcome, verdict, showHint, showExpected, showAnswer } = ui
  const patch = (p: Partial<typeof ui>) => setUi((prev) => ({ ...prev, ...p }))

  // 관련 테이블 미리보기와 기대 결과. id 가 현재 문제와 같을 때만 유효하다
  const [context, setContext] = useState<{ id: string; tables: TablePreview[]; expected: QueryResult | null } | null>(null)
  // DB 가 되돌려지거나 사용자가 데이터를 바꾸면 올려서 맥락을 다시 불러온다
  const [dataVersion, setDataVersion] = useState(0)
  const contextReady = context?.id === current.id

  const applyEngine = async (e: AsyncDbEngine) => {
    setEngine(e)
    setTables(await e.getTables())
    setDataVersion((v) => v + 1)
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
      const { outcome: o, tables: next, changed } = await engine.exec(sqlText, options)
      setTables(next)
      if (changed) setDataVersion((v) => v + 1)
      return { shown: o, graded: o.error ? null : o }
    }
    const snapshot = await engine.export()
    const { outcome: o } = await engine.exec(sqlText, options)
    const check = o.error ? null : (await engine.exec(current.checkSql, options)).outcome
    // 중단됐다면 엔진이 이미 복구 지점으로 돌아가 있다. 그 위에 시작 상태를 다시 올린다
    await engine.import(snapshot)
    return { shown: o.error || !check ? o : check, graded: check }
  }

  // 문제를 열면 관련 테이블과 기대 결과를 불러온다. 변경 문제의 기대 결과는 격리 실행이라
  // 그동안 사용자의 실행과 섞이지 않도록 준비될 때까지 실행·제출을 막는다 (contextReady)
  useEffect(() => {
    if (!engine) return
    let cancelled = false
    void (async () => {
      const all = await engine.getTables()
      const previews = await loadTablePreviews(engine, relatedTables(current, all))
      const answer = await execute(current.answerSql)
      if (cancelled) return
      setContext({ id: current.id, tables: previews, expected: answer?.graded ? lastQueryResult(answer.graded.results) : null })
    })()
    return () => {
      cancelled = true
    }
    // execute 는 engine 과 current 만 읽는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, current.id, dataVersion])

  // 실행할 때마다 올려 결과 패널이 화면 안으로 들어오게 한다
  const [runCount, setRunCount] = useState(0)

  const run = async () => {
    setRunning(true)
    try {
      const r = await execute(codeRef.current)
      if (r) patch({ outcome: r.shown })
      setRunCount((n) => n + 1)
      return r
    } finally {
      setRunning(false)
    }
  }

  const submit = async () => {
    const r = await run()
    if (!r || !engine) return
    const mineOutcome = r.graded
    if (!mineOutcome || mineOutcome.error || mineOutcome.results.length === 0) {
      patch({ verdict: { ok: false, message: r.shown.error ? '쿼리에 에러가 있습니다. 아래 메시지를 확인하세요.' : '결과가 없습니다. SQL 문을 작성하세요.' } })
      return
    }
    setRunning(true)
    const expected = await execute(current.answerSql).finally(() => setRunning(false))
    const expectedOutcome = expected?.graded
    if (!expectedOutcome || expectedOutcome.error || expectedOutcome.results.length === 0) {
      patch({ verdict: { ok: false, message: '정답을 계산할 수 없습니다. 샘플 데이터 되돌리기를 누른 뒤 다시 시도하세요.' } })
      return
    }
    // 여러 문장을 실행했다면 마지막 조회 결과로 채점
    const g = grade(lastQueryResult(mineOutcome.results)!, lastQueryResult(expectedOutcome.results)!, current.orderMatters)
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
          <ProblemContext tables={contextReady ? context.tables : []} loading={!contextReady} />

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
                <button disabled={!contextReady} onClick={() => void run()} className="btn btn-sm btn-outline" title="Cmd/Ctrl + Enter">
                  <Play size={12} /> 실행
                </button>
              )}
              <button disabled={running || !contextReady} onClick={() => void submit()} className="btn btn-sm btn-primary">
                <Send size={12} /> 제출
              </button>
              <button onClick={() => patch({ showHint: !showHint })} aria-pressed={showHint} className={['btn btn-sm ml-auto', showHint ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'btn-ghost'].join(' ')}>
                <Lightbulb size={12} /> 힌트
              </button>
              <button
                onClick={() => patch({ showExpected: !showExpected })}
                disabled={!contextReady}
                aria-pressed={showExpected}
                title="정답 쿼리를 실행하면 나오는 결과를 보여 줍니다. 쿼리는 보여 주지 않습니다"
                className={['btn btn-sm', showExpected ? 'bg-accent-soft text-accent-fg' : 'btn-ghost'].join(' ')}
              >
                <Target size={12} /> 기대 결과
              </button>
              <button
                onClick={() => patch({ showAnswer: !showAnswer })}
                aria-pressed={showAnswer}
                title="정답 쿼리를 보여 줍니다. 보고 나서도 제출과 해결 표시는 똑같이 됩니다"
                className={['btn btn-sm', showAnswer ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'btn-ghost'].join(' ')}
              >
                <Eye size={12} /> 정답 보기
              </button>
            </div>
          </div>

          {/*
            에디터 아래 영역. 도움(힌트 → 기대 결과 → 모범 답안)은 그것을 연 버튼 바로 아래에,
            내 실행 결과는 맨 아래 별도 패널에 둔다. 종류마다 색 띠와 아이콘이 달라 한눈에 구분된다
          */}
          <div className="mt-3 flex flex-col gap-3">
            {showHint && (
              <SectionPanel tone="amber" icon={<Lightbulb size={14} />} title="힌트" onClose={() => patch({ showHint: false })}>
                <p className="text-[13px] leading-relaxed">{current.hint}</p>
              </SectionPanel>
            )}

            {showExpected && contextReady && (
              <SectionPanel tone="accent" icon={<Target size={14} />} title="기대 결과" meta={expectedMeta(current, context.expected)} onClose={() => patch({ showExpected: false })}>
                <ExpectedResult problem={current} expected={context.expected} />
              </SectionPanel>
            )}

            {(showAnswer || verdict?.ok) && (
              <SectionPanel
                tone="violet"
                icon={<GraduationCap size={14} />}
                title={current.alternatives?.length ? '모범 답안과 다른 풀이' : '모범 답안'}
                onClose={showAnswer ? () => patch({ showAnswer: false }) : undefined}
              >
                <SolutionPanel problem={current} />
              </SectionPanel>
            )}

            {outcome && (
              <SectionPanel
                tone={verdict ? (verdict.ok ? 'emerald' : 'red') : outcome.error ? 'red' : 'neutral'}
                icon={verdict ? verdict.ok ? <CircleCheck size={14} /> : <CircleX size={14} /> : <TerminalSquare size={14} />}
                title={verdict ? (verdict.ok ? '내 실행 결과 · 정답' : '내 실행 결과 · 오답') : '내 실행 결과'}
                meta={current.checkSql && !outcome.error ? '내 SQL 실행 후 확인 쿼리로 본 결과' : undefined}
                scrollKey={runCount}
              >
                <div className="flex flex-col gap-3 text-sm">
                  {verdict && (
                    <p className={['text-[13px] font-medium', verdict.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'].join(' ')}>{verdict.message}</p>
                  )}
                  {outcome.results.map((r, i) =>
                    r.columns.length > 0 ? <ResultGrid key={i} result={r} /> : <p key={i} className="text-xs text-fg-muted">실행 완료 · {r.rowsAffected}행 영향</p>,
                  )}
                  {outcome.error && (
                    <div className="rounded-md border border-red-500/30 bg-red-500/8 p-2 text-xs">
                      <p className="font-mono text-red-600 dark:text-red-400">{outcome.error.message}</p>
                      {explainSqlError(outcome.error.message) && <p className="mt-1 text-fg">{explainSqlError(outcome.error.message)}</p>}
                    </div>
                  )}
                </div>
              </SectionPanel>
            )}
          </div>

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
