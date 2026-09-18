import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useDbStore } from '../../store/db-store'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  exportError: string | null
}

/**
 * 화면을 그리다 예외가 나면 앱 전체가 흰 화면이 된다. 그 대신 안내와 복구 수단을 보여 준다.
 * DB 는 화면과 별개로 살아 있으므로 파일로 내려받을 수 있게 한다.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, exportError: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('화면 렌더링 중 오류', error, info.componentStack)
  }

  private downloadDb = async () => {
    try {
      const data = await useDbStore.getState().exportDb()
      const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'application/x-sqlite3' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `sqlground-backup-${new Date().toISOString().slice(0, 10)}.sqlite`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      this.setState({ exportError: e instanceof Error ? e.message : String(e) })
    }
  }

  render() {
    const { error, exportError } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex h-full items-center justify-center bg-surface p-6 text-fg">
        <div className="max-w-lg">
          <h1 className="text-lg font-semibold">화면을 표시하다 문제가 생겼습니다</h1>
          <p className="mt-2 text-sm text-fg-muted">
            작업한 DB 는 브라우저에 저장돼 있어 새로고침하면 대부분 그대로 돌아옵니다. 걱정되면 먼저 DB 파일을 내려받아 두세요.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded bg-subtle p-3 font-mono text-xs text-red-700 dark:text-red-300">
            {error.message}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => window.location.reload()} className="rounded bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover">
              새로고침
            </button>
            <button onClick={() => void this.downloadDb()} className="rounded border border-line-strong px-3 py-1.5 text-sm hover:bg-hover">
              DB 파일 내려받기
            </button>
            <button onClick={() => this.setState({ error: null, exportError: null })} className="rounded border border-line-strong px-3 py-1.5 text-sm hover:bg-hover">
              다시 시도
            </button>
          </div>
          {exportError && <p className="mt-2 text-xs text-red-600">DB 파일을 만들지 못했습니다: {exportError}</p>}
        </div>
      </div>
    )
  }
}
