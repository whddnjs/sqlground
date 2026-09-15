import type { ExecOutcome } from '../../db/engine'
import { ResultGrid } from './ResultGrid'

export function ResultPanel({ outcome }: { outcome: ExecOutcome | null }) {
  if (!outcome) {
    return <p className="p-4 text-sm text-neutral-500">쿼리를 실행하면 결과가 여기에 표시됩니다.</p>
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      {outcome.results.map((r, i) => (
        <section key={i} className="flex flex-col gap-1">
          <header className="flex items-baseline gap-2 text-xs text-neutral-500">
            <code className="max-w-[60%] truncate font-mono text-neutral-700 dark:text-neutral-300">{r.sql}</code>
            <span>
              {r.columns.length > 0 ? `${r.rows.length.toLocaleString()}행` : `${r.rowsAffected}행 영향`}
            </span>
            <span>{r.durationMs.toFixed(1)} ms</span>
          </header>
          {r.columns.length > 0 && <ResultGrid result={r} />}
        </section>
      ))}
      {outcome.error && (
        <section className="rounded border border-red-300 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950">
          <p className="font-medium text-red-700 dark:text-red-300">{outcome.error.message}</p>
          <pre className="mt-1 overflow-x-auto font-mono text-xs text-red-600 dark:text-red-400">{outcome.error.sql}</pre>
        </section>
      )}
    </div>
  )
}
