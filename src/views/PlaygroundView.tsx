import { Group, Panel, Separator } from 'react-resizable-panels'
import { SqlEditor } from '../components/editor/SqlEditor'
import { ResultPanel } from '../components/result/ResultPanel'
import { SchemaBrowser } from '../components/schema/SchemaBrowser'
import { useDbStore } from '../store/db-store'

interface Props {
  code: string
  onCodeChange(code: string): void
  onRun(sql: string): void
}

export function PlaygroundView({ code, onCodeChange, onRun }: Props) {
  const { tables, outcome } = useDbStore()

  return (
    <Group orientation="horizontal" className="h-full">
      <Panel defaultSize="22%" minSize="12%" className="overflow-y-auto border-r border-neutral-200 dark:border-neutral-700">
        <SchemaBrowser tables={tables} />
      </Panel>
      <Separator className="w-1 bg-neutral-100 hover:bg-blue-300 dark:bg-neutral-800" />
      <Panel>
        <Group orientation="vertical">
          <Panel defaultSize="45%" minSize="20%" className="overflow-hidden">
            <SqlEditor value={code} onChange={onCodeChange} onRun={onRun} tables={tables} />
          </Panel>
          <Separator className="h-1 bg-neutral-100 hover:bg-blue-300 dark:bg-neutral-800" />
          <Panel className="overflow-y-auto">
            <ResultPanel outcome={outcome} />
          </Panel>
        </Group>
      </Panel>
    </Group>
  )
}
