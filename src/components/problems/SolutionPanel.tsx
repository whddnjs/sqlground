import type { Problem } from '../../problems/types'

/** 모범 답안 패널의 내용. 모범 답안과, 답이 여러 개 나올 문제에서는 다른 풀이 */
export function SolutionPanel({ problem }: { problem: Problem }) {
  const alternatives = problem.alternatives ?? []
  return (
    <div className="flex flex-col gap-4">
      <div>
        {alternatives.length > 0 && <p className="section-label mb-1.5">모범 답안</p>}
        <pre className="overflow-x-auto rounded-md bg-subtle p-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap">{problem.answerSql}</pre>
        {problem.answerNote && <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{problem.answerNote}</p>}
      </div>
      {alternatives.map((alt, i) => (
        <div key={i} className="border-t border-line pt-3">
          <p className="section-label mb-1.5">다른 풀이 {alternatives.length > 1 ? i + 1 : ''}</p>
          <pre className="overflow-x-auto rounded-md bg-subtle p-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap">{alt.sql}</pre>
          <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{alt.note}</p>
        </div>
      ))}
    </div>
  )
}
