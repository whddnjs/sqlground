import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  /** 무엇이 일어나는지 한두 문장 */
  message?: string
  /** 실행될 SQL. 있으면 그대로 보여 준다 */
  sql?: string
  confirmLabel?: string
  /** 되돌릴 수 없는 조작이면 true. 확인 버튼이 빨간색이 된다 */
  danger?: boolean
  /** 되돌리기로 복구 가능한지 안내 */
  undoable?: boolean
}

export interface AlertOptions {
  title: string
  message: string
}

interface Pending {
  kind: 'confirm' | 'alert'
  options: ConfirmOptions | AlertOptions
  resolve(ok: boolean): void
}

interface ConfirmState {
  pending: Pending | null
  /** 앱 다이얼로그로 확인을 받는다. 브라우저 기본 confirm 대신 쓴다 */
  confirm(options: ConfirmOptions): Promise<boolean>
  alert(options: AlertOptions): Promise<void>
  /** 다이얼로그가 호출한다 */
  settle(ok: boolean): void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  pending: null,
  confirm(options) {
    // 이미 열린 것이 있으면 취소로 닫고 새 것을 띄운다
    get().pending?.resolve(false)
    return new Promise((resolve) => set({ pending: { kind: 'confirm', options, resolve } }))
  },
  alert(options) {
    get().pending?.resolve(false)
    return new Promise((resolve) => set({ pending: { kind: 'alert', options, resolve: () => resolve() } }))
  },
  settle(ok) {
    const p = get().pending
    set({ pending: null })
    p?.resolve(ok)
  },
}))

/** 컴포넌트 밖(스토어, 헬퍼)에서도 쓸 수 있는 단축 함수 */
export const confirm = (options: ConfirmOptions) => useConfirmStore.getState().confirm(options)
export const alert = (options: AlertOptions) => useConfirmStore.getState().alert(options)
