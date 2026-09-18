import type { QueryResult } from '../../db/engine'
import { EXPECTED_ROWS } from '../../problems/context'
import type { Problem } from '../../problems/types'
import { DataPreview } from './DataPreview'

/** 기대 결과 패널의 내용. 정답 쿼리를 실행한 값만 보여 주고 쿼리 자체는 보여 주지 않는다 */
export function ExpectedResult({ problem, expected }: { problem: Problem; expected: QueryResult | null }) {
  if (!expected) return <p className="text-xs text-fg-subtle">기대 결과를 계산하지 못했습니다. 샘플 데이터 되돌리기를 누른 뒤 다시 열어 보세요.</p>

  return (
    <>
      <p className="mb-2 text-xs text-fg-muted">
        {problem.checkSql ? '정답을 실행한 뒤 확인 쿼리로 보면 이렇게 나와야 합니다.' : '정답 쿼리를 실행하면 이렇게 나옵니다.'} 열 이름은 달라도 되고 값만 같으면 정답입니다.
      </p>
      <DataPreview columns={expected.columns.map((name) => ({ name }))} rows={expected.rows.slice(0, EXPECTED_ROWS)} total={expected.rows.length} />
    </>
  )
}
