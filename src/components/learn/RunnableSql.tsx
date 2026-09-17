import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { ExternalLink, Play, RotateCcw, Square } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { ExecOutcome } from '../../db/engine'
import { useLessonDb } from '../../learn/lesson-db-context'
import { sqlExtensions } from '../../lib/editor-schema'
import { explainSqlError } from '../../lib/error-messages'
import { useEffectiveTheme, useSettingsStore } from '../../store/settings-store'
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
  const theme = useEffectiveTheme()
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
      .then(setOutcome)
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
    <div className="my-4 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
      <CodeMirror
        value={code}
        onChange={setCode}
        extensions={extensions}
        theme={theme}
        basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false }}
        style={{ fontSize }}
      />
      <div className="flex items-center gap-1 border-t border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800/60">
        {running ? (
          <button onClick={cancel} className="flex items-center gap-1 rounded bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-700">
            <Square size={11} /> 중단
          </button>
        ) : (
          <button onClick={run} className="flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700">
            <Play size={12} /> 실행
          </button>
        )}
        {code !== initialSql && (
          <button onClick={() => setCode(initialSql)} title="예제 원래대로" className="flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700">
            <RotateCcw size={12} /> 원래대로
          </button>
        )}
        <button onClick={() => onOpenInPlayground(code)} className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700">
          <ExternalLink size={12} /> 연습장에서 열기
        </button>
      </div>
      {outcome && (
        <div className="flex flex-col gap-3 border-t border-neutral-200 p-3 text-sm dark:border-neutral-700">
          {outcome.results.map((r, i) => (
            <div key={i} className="flex flex-col gap-1">
              {outcome.results.length > 1 && <code className="truncate font-mono text-xs text-neutral-500">{r.sql}</code>}
              {r.columns.length > 0 ? <ResultGrid result={r} /> : <p className="text-xs text-neutral-500">실행 완료 · {r.rowsAffected}행 영향</p>}
            </div>
          ))}
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
