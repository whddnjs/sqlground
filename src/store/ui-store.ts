import { create } from 'zustand'

export type View = 'playground' | 'learn' | 'erd' | 'problems' | 'settings'

interface UiState {
  view: View
  setView(view: View): void
}

export const useUiStore = create<UiState>((set) => ({
  view: 'playground',
  setView: (view) => set({ view }),
}))
