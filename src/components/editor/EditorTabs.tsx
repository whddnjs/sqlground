import { Plus, X } from 'lucide-react'
import { useState } from 'react'
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
    <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-neutral-200 bg-neutral-50 px-1 dark:border-neutral-700 dark:bg-neutral-950">
      {tabs.map((t) => {
        const active = t.id === activeId
        return (
          <div
            key={t.id}
            className={[
              'group flex shrink-0 items-center gap-1 border-b-2 py-1 pr-1 pl-3 text-xs',
              active
                ? 'border-blue-600 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200',
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
                className="w-24 rounded border border-blue-400 bg-white px-1 text-xs focus:outline-none dark:bg-neutral-800"
              />
            ) : (
              <button onClick={() => selectTab(t.id)} onDoubleClick={() => setRenaming({ id: t.id, name: t.name })} title="더블클릭으로 이름 변경" className="max-w-40 truncate">
                {t.name}
              </button>
            )}
            <button
              onClick={() => {
                if (t.code.trim() === '' || window.confirm(`'${t.name}' 탭을 닫을까요? 작성한 내용이 사라집니다.`)) closeTab(t.id)
              }}
              aria-label={`${t.name} 탭 닫기`}
              className={['rounded p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700', active ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'].join(' ')}
            >
              <X size={11} />
            </button>
          </div>
        )
      })}
      <button onClick={addTab} title="새 쿼리 탭" aria-label="새 쿼리 탭" className="ml-1 rounded p-1 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800">
        <Plus size={13} />
      </button>
    </div>
  )
}
