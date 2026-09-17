import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

/**
 * 앱 토큰(CSS 변수)을 그대로 쓰는 에디터 테마. 색이 변수라 라이트/다크 전환에 따로 대응할 필요가 없다.
 * @uiw/react-codemirror 의 기본 테마는 앱과 배경색이 달라 화면이 누더기처럼 보였다.
 */
const chrome = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: 'var(--color-fg)', height: '100%' },
  '.cm-content': { fontFamily: 'var(--font-mono)', caretColor: 'var(--color-accent)', padding: '10px 0' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.65' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--color-accent)', borderLeftWidth: '2px' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'var(--syn-selection)' },
  '.cm-activeLine': { backgroundColor: 'var(--syn-active-line)' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--color-fg-subtle)', border: 'none', paddingLeft: '6px' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--color-fg-muted)' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 6px', minWidth: '28px' },
  '.cm-foldGutter .cm-gutterElement': { color: 'var(--color-fg-subtle)' },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': { backgroundColor: 'var(--color-accent-soft)', outline: '1px solid var(--color-accent)' },
  '.cm-placeholder': { color: 'var(--color-fg-subtle)' },
  // 자동완성 팝업
  '.cm-tooltip': { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-line-strong)', borderRadius: '8px', boxShadow: 'var(--shadow-pop)', overflow: 'hidden' },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-mono)', fontSize: '12.5px', maxHeight: '16em' },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': { padding: '3px 10px 3px 6px', color: 'var(--color-fg)' },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'var(--color-accent)', color: '#fff' },
  '.cm-completionDetail': { color: 'var(--color-fg-subtle)', fontStyle: 'normal', marginLeft: '1em' },
  'li[aria-selected] .cm-completionDetail': { color: 'rgb(255 255 255 / 0.75)' },
  '.cm-completionIcon': { opacity: '0.6', width: '1.1em' },
  // 찾기 패널
  '.cm-panels': { backgroundColor: 'var(--color-subtle)', color: 'var(--color-fg)', borderColor: 'var(--color-line)' },
  '.cm-panels.cm-panels-bottom': { borderTop: '1px solid var(--color-line)' },
  '.cm-textfield': { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-line-strong)', borderRadius: '4px' },
  '.cm-button': { backgroundImage: 'none', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-line-strong)', borderRadius: '4px' },
  '.cm-searchMatch': { backgroundColor: 'rgb(250 204 21 / 0.35)' },
})

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: 'var(--syn-keyword)', fontWeight: '500' },
  { tag: [t.string, t.special(t.string)], color: 'var(--syn-string)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--syn-number)' },
  { tag: [t.lineComment, t.blockComment, t.comment], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.typeName, t.standard(t.name), t.function(t.variableName)], color: 'var(--syn-type)' },
  { tag: [t.operator, t.punctuation, t.separator, t.bracket], color: 'var(--syn-operator)' },
])

export const editorTheme: Extension = [chrome, syntaxHighlighting(highlight)]
