import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { confirm } from '../../store/confirm-store'
import { useEditorStore } from '../../store/editor-store'

/** 연습장 에디터 위의 쿼리 탭. 더블클릭으로 이름 변경 */
export function EditorTabs() {
  const { tabs, activeId, addTab, closeTab, selectTab, renameTab } = useEditorStore()
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)

  const finishRename = () => {
    if (renaming) renameTab(renaming.id, renaming.name)
    setRenaming(null)
  }

  return (
    <div className="flex h-10 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-line px-1.5">
      {tabs.map((t) => {
        const active = t.id === activeId
        return (
          <div
            key={t.id}
            className={[
              'group flex h-7 shrink-0 items-center gap-1 rounded-md pr-1 pl-2.5 text-xs font-medium transition-colors',
              active ? 'bg-accent-soft text-accent-fg' : 'text-fg-muted hover:bg-hover hover:text-fg',
            ].join(' ')}
          >
            {renaming?.id === t.id ? (
              <input
                autoFocus
                value={renaming.name}
                onChange={(e) => setRenaming({ id: t.id, name: e.target.value })}
                onBlur={finishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishRename()
                  if (e.key === 'Escape') setRenaming(null)
                }}
                className="w-24 rounded border border-accent bg-surface px-1 text-xs focus:outline-none"
              />
            ) : (
              <button onClick={() => selectTab(t.id)} onDoubleClick={() => setRenaming({ id: t.id, name: t.name })} title="더블클릭으로 이름 변경" className="max-w-40 truncate">
                {t.name}
              </button>
            )}
            <button
              onClick={() => {
                if (t.code.trim() === '') return closeTab(t.id)
                void confirm({ title: `'${t.name}' 탭을 닫을까요?`, message: '작성한 내용이 사라집니다.', confirmLabel: '닫기', danger: true }).then((ok) => {
                  if (ok) closeTab(t.id)
                })
              }}
              aria-label={`${t.name} 탭 닫기`}
              className={['rounded p-0.5 hover:bg-hover-strong', active ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'].join(' ')}
            >
              <X size={11} />
            </button>
          </div>
        )
      })}
      <button onClick={addTab} title="새 쿼리 탭" aria-label="새 쿼리 탭" className="btn-icon ml-0.5">
        <Plus size={13} />
      </button>
    </div>
  )
}
