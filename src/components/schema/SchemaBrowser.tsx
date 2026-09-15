import type { TableInfo } from '../../db/engine'

export function SchemaBrowser({ tables }: { tables: TableInfo[] }) {
  if (tables.length === 0) {
    return <p className="p-3 text-sm text-neutral-500">테이블이 없습니다. CREATE TABLE 로 만들어 보세요.</p>
  }

  return (
    <ul className="p-2 text-sm">
      {tables.map((t) => (
        <li key={t.name}>
          <details open>
            <summary className="cursor-pointer rounded px-1 py-0.5 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800">
              {t.name}
            </summary>
            <ul className="ml-4 border-l border-neutral-200 pl-2 dark:border-neutral-700">
              {t.columns.map((c) => (
                <li key={c.name} className="flex justify-between gap-2 py-0.5 font-mono text-xs">
                  <span>
                    {c.primaryKey && <span className="mr-1 text-amber-600">PK</span>}
                    {c.name}
                  </span>
                  <span className="text-neutral-400">
                    {c.type}
                    {c.notNull && ' !'}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </li>
      ))}
    </ul>
  )
}
