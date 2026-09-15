import { SQLite, sql } from '@codemirror/lang-sql'
import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { BookOpen, Check, ChevronLeft, ChevronRight, Eye, Lightbulb, Play, RotateCcw, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { ResultGrid } from '../components/result/ResultGrid'
import type { DbEngine, ExecOutcome } from '../db/engine'
import { CHAPTERS } from '../learn/content'
import { getLessonEngine, resetLessonEngine } from '../learn/lesson-engine'
import { explainSqlError } from '../lib/error-messages'
import { PROBLEMS } from '../problems/content'
import { grade, type GradeResult } from '../problems/grade'
import type { Problem } from '../problems/types'
import { useLearnStore } from '../store/learn-store'
import { useProblemStore } from '../store/problem-store'
import { useEffectiveTheme, useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'

/** 단원 순서대로 문제를 묶는다. 문제가 없는 단원은 건너뛴다 */
const GROUPS = CHAPTERS.map((c) => ({
  chapter: c,
  lessons: c.lessons.map((l) => ({ lesson: l, problems: PROBLEMS.filter((p) => p.lessonId === l.id) })).filter((x) => x.problems.length > 0),
})).filter((g) => g.lessons.length > 0)

const ORDERED: Problem[] = GROUPS.flatMap((g) => g.lessons.flatMap((l) => l.problems))
const DIFFICULTY = { 1: '쉬움', 2: '보통', 3: '어려움' } as const

export function ProblemsView() {
  const { solved, drafts, lastProblem, select, saveDraft, markSolved } = useProblemStore()
  const selectLesson = useLearnStore((s) => s.select)
  const setView = useUiStore((s) => s.setView)
  const theme = useEffectiveTheme()
  const fontSize = useSettingsStore((s) => s.fontSize)

  const current = ORDERED.find((p) => p.id === lastProblem) ?? ORDERED[0]
  const index = ORDERED.indexOf(current)
  const prev = ORDERED[index - 1]
  const next = ORDERED[index + 1]
  const isSolved = solved.includes(current.id)

  const [engine, setEngine] = useState<DbEngine | null>(null)
  const [code, setCode] = useState(drafts[current.id] ?? '')
  const [outcome, setOutcome] = useState<ExecOutcome | null>(null)
  const [verdict, setVerdict] = useState<GradeResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    void getLessonEngine().then(setEngine)
  }, [])

  // 문제가 바뀌면 상태 초기화 (draft 는 복원)
  useEffect(() => {
    setCode(drafts[current.id] ?? '')
    setOutcome(null)
    setVerdict(null)
    setShowHint(false)
    setShowAnswer(false)
    setAttempts(0)
    // drafts 는 타이핑마다 바뀌므로 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id])

  const codeRef = useRef(code)
  codeRef.current = code

  const run = (): ExecOutcome | null => {
    if (!engine) return null
    const o = engine.exec(codeRef.current)
    setOutcome(o)
    return o
  }

  const submit = () => {
    const o = run()
    if (!o || !engine) return
    setAttempts((n) => n + 1)
    if (o.error || o.results.length === 0) {
      setVerdict({ ok: false, message: o.error ? '쿼리에 에러가 있습니다. 아래 메시지를 확인하세요.' : '결과가 없습니다. SELECT 문을 작성하세요.' })
      return
    }
    const expected = engine.exec(current.answerSql)
    if (expected.error || expected.results.length === 0) {
      setVerdict({ ok: false, message: '정답을 계산할 수 없습니다. 예제 DB 를 초기화한 뒤 다시 시도하세요.' })
      return
    }
    // 여러 문장을 실행했다면 마지막 조회 결과로 채점
    const mine = [...o.results].reverse().find((r) => r.columns.length > 0) ?? o.results[o.results.length - 1]
    const g = grade(mine, expected.results[expected.results.length - 1], current.orderMatters)
    setVerdict(g)
    if (g.ok) markSolved(current.id)
  }

  const extensions = useMemo(
    () => [
      sql({ dialect: SQLite, upperCaseKeywords: true }),
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => (run(), true) }, { key: 'Ctrl-Enter', run: () => (run(), true) }])),
    ],
    // run 은 ref 만 읽으므로 처음 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine],
  )

  const goLesson = () => {
    selectLesson(current.lessonId)
    setView('learn')
  }
  const lessonTitle = CHAPTERS.flatMap((c) => c.lessons).find((l) => l.id === current.lessonId)?.title ?? ''

  return (
    <div className="flex h-full">
      <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-700">
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {GROUPS.map((g) => (
            <div key={g.chapter.id} className="mb-3">
              <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">{g.chapter.title}</p>
              {g.lessons.map((l) => (
                <ul key={l.lesson.id}>
                  {l.problems.map((p) => {
                    const active = p.id === current.id
                    const done = solved.includes(p.id)
                    return (
                      <li key={p.id}>
                        <button
                          onClick={() => select(p.id)}
                          className={[
                            'flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm',
                            active ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]',
                              done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-300 dark:border-neutral-600',
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
        <div className="border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700">
          {solved.length} / {ORDERED.length} 해결
        </div>
      </aside>

      <article className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-6">
          <div className="mb-3 flex items-center gap-3 text-xs text-neutral-500">
            <span>
              {index + 1} / {ORDERED.length}
            </span>
            <span className="flex items-center gap-1">
              <Difficulty level={current.difficulty} /> {DIFFICULTY[current.difficulty]}
            </span>
            <button onClick={goLesson} className="flex items-center gap-1 rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <BookOpen size={12} /> 관련 단원: {lessonTitle}
            </button>
            <button
              onClick={() => void resetLessonEngine().then(setEngine)}
              title="예제 DB 를 샘플 데이터 상태로 되돌립니다"
              className="ml-auto flex items-center gap-1 rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <RotateCcw size={12} /> 예제 DB 초기화
            </button>
          </div>

          <h1 className="mb-3 flex items-center gap-2 text-2xl font-semibold">
            {current.title}
            {isSolved && <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">해결</span>}
          </h1>
          <div className="lesson-body mb-4">
            <Markdown
              components={{
                code: ({ children }) => <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-neutral-800">{String(children)}</code>,
              }}
            >
              {current.description}
            </Markdown>
          </div>
          <p className="mb-4 text-xs text-neutral-500">
            채점은 결과의 <strong>값</strong>만 비교합니다. 열 이름은 자유이고, {current.orderMatters ? '이 문제는 행 순서까지 맞아야 합니다.' : '행 순서는 상관없습니다.'}
          </p>

          <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
            <CodeMirror
              value={code}
              onChange={(v) => {
                setCode(v)
                saveDraft(current.id, v)
              }}
              extensions={extensions}
              theme={theme}
              minHeight="120px"
              placeholder="여기에 SQL 을 작성하세요"
              basicSetup={{ foldGutter: false, highlightActiveLine: false }}
              style={{ fontSize }}
            />
            <div className="flex items-center gap-1 border-t border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800/60">
              <button onClick={run} className="flex items-center gap-1 rounded px-2.5 py-1 text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700" title="Cmd/Ctrl + Enter">
                <Play size={12} /> 실행
              </button>
              <button onClick={submit} className="flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700">
                <Send size={12} /> 제출
              </button>
              <button onClick={() => setShowHint((h) => !h)} className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700">
                <Lightbulb size={12} /> 힌트
              </button>
              <button
                onClick={() => setShowAnswer((a) => !a)}
                disabled={attempts === 0 && !isSolved}
                title={attempts === 0 && !isSolved ? '한 번 제출한 뒤에 볼 수 있습니다' : undefined}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-200 disabled:opacity-40 dark:hover:bg-neutral-700"
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
            <pre className="mt-3 overflow-x-auto rounded border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-800">{current.answerSql}</pre>
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
              {outcome.results.map((r, i) =>
                r.columns.length > 0 ? <ResultGrid key={i} result={r} /> : <p key={i} className="text-xs text-neutral-500">실행 완료 · {r.rowsAffected}행 영향</p>,
              )}
              {outcome.error && (
                <div className="rounded border border-red-300 bg-red-50 p-2 text-xs dark:border-red-800 dark:bg-red-950">
                  <p className="font-mono text-red-600 dark:text-red-400">{outcome.error.message}</p>
                  {explainSqlError(outcome.error.message) && <p className="mt-1 text-red-800 dark:text-red-200">{explainSqlError(outcome.error.message)}</p>}
                </div>
              )}
            </div>
          )}

          <div className="mt-10 flex items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <button disabled={!prev} onClick={() => prev && select(prev.id)} className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800">
              <ChevronLeft size={16} /> {prev?.title ?? '이전'}
            </button>
            <button disabled={!next} onClick={() => next && select(next.id)} className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800">
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
        <span key={i} className={['h-1.5 w-1.5 rounded-full', i <= level ? 'bg-amber-500' : 'bg-neutral-200 dark:bg-neutral-700'].join(' ')} />
      ))}
    </span>
  )
}
