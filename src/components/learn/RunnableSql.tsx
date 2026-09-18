import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { ExternalLink, Pencil, Play, RotateCcw, Square } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { ExecOutcome } from '../../db/engine'
import { useLessonDb } from '../../learn/lesson-db-context'
import { sqlExtensions } from '../../lib/editor-schema'
import { explainSqlError } from '../../lib/error-messages'
import { useSettingsStore } from '../../store/settings-store'
import { ResultGrid } from '../result/ResultGrid'

interface Props {
  initialSql: string
}

/** 학습 페이지의 예제 블록. 고쳐서 다시 실행할 수 있고, 결과가 바로 아래에 붙는다 */
export function RunnableSql({ initialSql }: Props) {
  const { tables, run: onRun, cancel, openInPlayground: onOpenInPlayground } = useLessonDb()
  const [running, setRunning] = useState(false)
  const [code, setCode] = useState(initialSql)
  const [outcome, setOutcome] = useState<ExecOutcome | null>(null)
  const [changed, setChanged] = useState(false)
  const fontSize = useSettingsStore((s) => s.fontSize)

  // 단축키 핸들러가 항상 최신 code 를 보도록 ref 로 둔다 (extensions 를 매번 새로 만들지 않기 위해)
  const codeRef = useRef(code)
  codeRef.current = code
  const onRunRef = useRef(onRun)
  onRunRef.current = onRun
  const run = () => {
    setRunning(true)
    void onRunRef
      .current(codeRef.current)
      .then((r) => {
        setOutcome(r.outcome)
        setChanged(r.changed)
      })
      .finally(() => setRunning(false))
  }
  const extensions = useMemo(
    () => [
      ...sqlExtensions(tables),
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => (run(), true) }, { key: 'Ctrl-Enter', run: () => (run(), true) }])),
    ],
    // run 은 ref 만 읽는다. 스키마가 바뀌면 자동완성 갱신을 위해 다시 만든다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tables],
  )

  return (
    <div className="my-5 overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
      <CodeMirror
        value={code}
        onChange={setCode}
        extensions={extensions}
        theme="none"
        basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false }}
        style={{ fontSize }}
      />
      <div className="flex items-center gap-1 border-t border-line bg-subtle/60 px-2 py-1.5">
        {running ? (
          <button onClick={cancel} className="btn btn-sm btn-danger">
            <Square size={11} /> 중단
          </button>
        ) : (
          <button onClick={run} className="btn btn-sm btn-primary">
            <Play size={12} /> 실행
          </button>
        )}
        {code !== initialSql && (
          <button onClick={() => setCode(initialSql)} title="예제 원래대로" className="btn btn-sm btn-ghost">
            <RotateCcw size={12} /> 원래대로
          </button>
        )}
        <button onClick={() => onOpenInPlayground(code)} className="btn btn-sm btn-ghost ml-auto">
          <ExternalLink size={12} /> 연습장에서 열기
        </button>
      </div>
      {outcome && (
        <div className="flex flex-col gap-3 border-t border-line p-3 text-sm">
          {outcome.results.map((r, i) => (
            <div key={i} className="flex flex-col gap-1">
              {outcome.results.length > 1 && <code className="truncate font-mono text-xs text-fg-muted">{r.sql}</code>}
              {r.columns.length > 0 ? <ResultGrid result={r} /> : <p className="text-xs text-fg-muted">실행 완료 · {r.rowsAffected}행 영향</p>}
            </div>
          ))}
          {changed && !outcome.error && (
            <p className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
              <Pencil size={11} /> 이 예제는 학습용 DB 의 데이터를 바꿨어요. 위쪽 "샘플 데이터 되돌리기" 로 처음 상태로 돌아갈 수 있습니다.
            </p>
          )}
          {outcome.error && (
            <div className="rounded border border-red-300 bg-red-50 p-2 text-xs dark:border-red-800 dark:bg-red-950">
              <p className="font-mono text-red-600 dark:text-red-400">{outcome.error.message}</p>
              {explainSqlError(outcome.error.message) && <p className="mt-1 text-red-800 dark:text-red-200">{explainSqlError(outcome.error.message)}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
