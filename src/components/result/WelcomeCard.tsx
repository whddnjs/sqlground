import { BookOpen, Play, Sparkles, Upload } from 'lucide-react'
import { PRESETS } from '../../db/presets'
import { usePresetLoader } from '../../lib/use-preset-loader'
import { useDbStore } from '../../store/db-store'
import { useEditorStore } from '../../store/editor-store'
import { useNavigate } from 'react-router'
import { routes } from '../../routes'

/** 테이블이 하나도 없을 때 결과 영역에 보여 주는 시작 안내. 테이블이 생기면 자연히 사라진다 */
export function WelcomeCard() {
  const loadPreset = usePresetLoader()
  const run = useDbStore((s) => s.run)
  const code = useEditorStore((s) => s.code)
  const navigate = useNavigate()

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-accent-fg uppercase">
          <Sparkles size={13} /> 시작하기
        </p>
        <h2 className="mt-1.5 text-lg font-semibold">아직 테이블이 없어요. 셋 중 하나로 시작해 보세요.</h2>

        <div className="mt-4 grid gap-2">
          <div className="rounded-lg border border-line p-3">
            <p className="flex items-center gap-1.5 text-[13px] font-medium">
              <Upload size={14} className="text-accent-fg" /> 샘플 데이터로 바로 연습
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">테이블과 데이터가 채워진 상태에서 SELECT 부터 시작합니다.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => void loadPreset(p)} className="btn btn-sm btn-outline">
                  {p.name}
                  <span className="text-fg-subtle">· {p.tables.length}개 테이블</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => void run(code)} className="group flex items-start gap-3 rounded-lg border border-line p-3 text-left hover:bg-hover">
            <Play size={14} className="mt-0.5 shrink-0 text-accent-fg" />
            <span>
              <span className="block text-[13px] font-medium">에디터의 예시 쿼리 실행</span>
              <span className="mt-0.5 block text-xs text-fg-muted">테이블을 만들고 행을 넣고 조회하는 세 문장이 들어 있습니다.</span>
            </span>
          </button>

          <button onClick={() => navigate(routes.learn)} className="group flex items-start gap-3 rounded-lg border border-line p-3 text-left hover:bg-hover">
            <BookOpen size={14} className="mt-0.5 shrink-0 text-accent-fg" />
            <span>
              <span className="block text-[13px] font-medium">처음부터 배우기</span>
              <span className="mt-0.5 block text-xs text-fg-muted">SQL 이 무엇인지부터 JOIN, 트랜잭션까지 23단원. 예제는 페이지 안에서 바로 실행됩니다.</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
