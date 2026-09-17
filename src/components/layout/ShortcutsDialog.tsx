import { Modal } from '../ui/Modal'

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const MOD = IS_MAC ? '⌘' : 'Ctrl'

interface Row {
  keys: string[]
  what: string
}

const SECTIONS: Array<{ title: string; rows: Row[] }> = [
  {
    title: '어디서나',
    rows: [
      { keys: ['?'], what: '이 단축키 안내 열기' },
      { keys: ['Esc'], what: '열려 있는 대화상자 · 관계도 닫기' },
    ],
  },
  {
    title: 'SQL 에디터 (연습장 · 학습 예제)',
    rows: [
      { keys: [`${MOD} + Enter`, 'Ctrl + Enter'], what: '실행. 선택 영역이 있으면 그 부분만, 없으면 전체' },
      { keys: [`${MOD} + Z`, `${MOD} + Shift + Z`], what: '에디터 입력 취소 · 다시 실행 (DB 되돌리기는 헤더 버튼)' },
      { keys: [`${MOD} + /`], what: '선택한 줄 주석 처리 · 해제' },
      { keys: [`${MOD} + F`], what: '에디터 안에서 찾기 · 바꾸기' },
      { keys: ['Tab', 'Shift + Tab'], what: '들여쓰기 · 내어쓰기' },
      { keys: ['Ctrl + Space'], what: '자동완성 열기 (테이블 · 컬럼 · 키워드)' },
      { keys: ['탭 더블클릭'], what: '연습장 쿼리 탭 이름 변경' },
    ],
  },
  {
    title: '결과 그리드 (단일 테이블 조회일 때)',
    rows: [
      { keys: ['더블클릭'], what: '셀 편집 시작' },
      { keys: ['Enter'], what: '편집한 값 저장 (UPDATE 실행)' },
      { keys: ['Esc'], what: '편집 취소' },
    ],
  },
  {
    title: '관계도',
    rows: [
      { keys: ['드래그'], what: '박스 이동 · 빈 곳은 화면 이동' },
      { keys: ['클릭', '더블클릭'], what: '테이블 선택 · 구조 변경 열기' },
      { keys: ['휠'], what: '화면 이동' },
      { keys: [`${MOD} + 휠`, 'Ctrl + 휠'], what: '확대 · 축소' },
    ],
  },
]

export function ShortcutsDialog({ onClose }: { onClose(): void }) {
  return (
    <Modal title="단축키" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h3 className="mb-2 text-xs font-medium text-neutral-500">{s.title}</h3>
            <table className="w-full text-sm">
              <tbody>
                {s.rows.map((r) => (
                  <tr key={r.what} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="w-52 py-1.5 pr-3 align-top">
                      {r.keys.map((k, i) => (
                        <span key={k}>
                          {i > 0 && <span className="mx-1 text-neutral-400">/</span>}
                          <kbd className="rounded border border-neutral-300 bg-neutral-50 px-1.5 py-0.5 font-mono text-xs dark:border-neutral-600 dark:bg-neutral-800">{k}</kbd>
                        </span>
                      ))}
                    </td>
                    <td className="py-1.5 text-neutral-700 dark:text-neutral-300">{r.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </Modal>
  )
}
