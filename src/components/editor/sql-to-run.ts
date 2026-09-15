import type { EditorView } from '@codemirror/view'

/** 선택 영역이 있으면 선택 부분, 없으면 문서 전체 */
export function sqlToRun(view: EditorView): string {
  const { from, to } = view.state.selection.main
  return from === to ? view.state.doc.toString() : view.state.sliceDoc(from, to)
}
