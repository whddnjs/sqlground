import { useCallback } from 'react'
import type { Preset } from '../db/presets'
import { confirm } from '../store/confirm-store'
import { useDbStore } from '../store/db-store'
import { useDescriptionStore } from '../store/description-store'

/** 샘플 로드. 같은 이름의 테이블이 있으면 덮어쓰기 확인을 받고, 컬럼 한글 설명도 함께 싣는다 */
export function usePresetLoader() {
  const tables = useDbStore((s) => s.tables)
  const loadPreset = useDbStore((s) => s.loadPreset)
  const setDescriptions = useDescriptionStore((s) => s.setMany)

  return useCallback(
    async (preset: Preset) => {
      const existing = tables.map((t) => t.name).filter((n) => preset.tables.includes(n))
      if (existing.length > 0) {
        const ok = await confirm({
          title: `${preset.name} 샘플로 덮어쓸까요?`,
          message: `이미 있는 테이블(${existing.join(', ')})을 샘플 데이터로 다시 만듭니다.`,
          confirmLabel: '덮어쓰기',
          danger: true,
          undoable: true,
        })
        if (!ok) return
      }
      await loadPreset(preset)
      setDescriptions(preset.descriptions)
    },
    [tables, loadPreset, setDescriptions],
  )
}
