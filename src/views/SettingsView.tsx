import { Download, Monitor, Moon, Sun, Upload } from 'lucide-react'
import { useRef } from 'react'
import { alert, confirm } from '../store/confirm-store'
import { useDbStore } from '../store/db-store'
import { useSettingsStore, type Theme } from '../store/settings-store'

const THEMES: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
  { value: 'system', label: '시스템', icon: <Monitor size={14} /> },
  { value: 'light', label: '라이트', icon: <Sun size={14} /> },
  { value: 'dark', label: '다크', icon: <Moon size={14} /> },
]

export function SettingsView() {
  const { theme, fontSize, foreignKeys, ligatures, update } = useSettingsStore()
  const { exportDb, importDb, setForeignKeys, tables } = useDbStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const download = async () => {
    const blob = new Blob([(await exportDb()) as BlobPart], { type: 'application/x-sqlite3' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sqlground-${new Date().toISOString().slice(0, 10)}.sqlite`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (tables.length > 0) {
      const ok = await confirm({
        title: 'DB 파일을 가져올까요?',
        message: `현재 DB 를 '${file.name}' 의 내용으로 완전히 바꿉니다.`,
        confirmLabel: '가져오기',
        danger: true,
        undoable: true,
      })
      if (!ok) {
        if (fileRef.current) fileRef.current.value = ''
        return
      }
    }
    try {
      await importDb(new Uint8Array(await file.arrayBuffer()))
    } catch (e) {
      await alert({ title: '파일을 열 수 없습니다', message: e instanceof Error ? e.message : String(e) })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="card h-full overflow-y-auto">
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h2 className="mb-8 text-[26px] font-bold tracking-tight">설정</h2>

      <Section title="화면" description="테마는 이 브라우저에만 저장됩니다.">
        <div className="flex gap-1 rounded-lg border border-line bg-subtle p-1">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => update({ theme: t.value })}
              className={[
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                theme === t.value ? 'bg-surface text-fg shadow-panel' : 'text-fg-muted hover:text-fg',
              ].join(' ')}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="에디터" description="SQL 에디터의 글꼴 크기입니다.">
        <div className="flex items-center gap-3">
          <input type="range" min={11} max={22} value={fontSize} onChange={(e) => update({ fontSize: Number(e.target.value) })} className="flex-1 accent-(--color-accent)" />
          <span className="w-12 text-right text-sm tabular-nums">{fontSize}px</span>
        </div>
        <pre className="mt-2 rounded bg-subtle p-2 font-mono" style={{ fontSize }}>
          SELECT name FROM users WHERE age &gt;= 20 AND city &lt;&gt; 'x';
        </pre>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5 accent-(--color-accent)" checked={ligatures} onChange={(e) => update({ ligatures: e.target.checked })} />
          <span>
            코드 글꼴 합자 사용
            <span className="mt-0.5 block text-xs text-fg-muted">
              켜면 <code className="font-mono">&gt;=</code> <code className="font-mono">&lt;&gt;</code> <code className="font-mono">!=</code> 가 한 기호처럼 이어져 보입니다. 처음 배울 때는 두 글자로 따로 보이는 게 헷갈리지 않아 기본은 꺼 두었습니다.
            </span>
          </span>
        </label>
      </Section>

      <Section
        title="데이터베이스"
        description="FOREIGN KEY 제약을 끄면 참조하는 행이 없어도 INSERT 가 되고, 참조되는 행도 지울 수 있습니다. 실무 DB 처럼 연습하려면 켜 두세요."
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-(--color-accent)"
            checked={foreignKeys}
            onChange={(e) => {
              update({ foreignKeys: e.target.checked })
              void setForeignKeys(e.target.checked)
            }}
          />
          FOREIGN KEY 제약 강제
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => void download()} className="btn btn-outline">
            <Download size={14} /> DB 파일 내보내기 (.sqlite)
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn btn-outline">
            <Upload size={14} /> DB 파일 가져오기
          </button>
          <input ref={fileRef} type="file" accept=".sqlite,.db,.sqlite3" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
        <p className="mt-2 text-xs text-fg-muted">
          내보낸 파일은 DB Browser for SQLite 같은 다른 도구에서도 열립니다. 컬럼 한글 설명은 파일에 포함되지 않습니다.
        </p>
      </Section>
    </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-line p-5">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {description && <p className="mt-0.5 mb-3 text-xs text-fg-muted">{description}</p>}
      {children}
    </section>
  )
}
