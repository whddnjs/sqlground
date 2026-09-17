import { beforeEach, describe, expect, it } from 'vitest'
import { nextTabName, useEditorStore } from './editor-store'

const state = () => useEditorStore.getState()

describe('editor-store 탭', () => {
  beforeEach(() => {
    useEditorStore.setState({ tabs: [{ id: 'a', name: '쿼리 1', code: 'SELECT 1;' }], activeId: 'a', code: 'SELECT 1;' })
  })

  it('새 탭을 만들면 활성 탭이 되고 내용은 비어 있다', () => {
    state().addTab()
    expect(state().tabs.map((t) => t.name)).toEqual(['쿼리 1', '쿼리 2'])
    expect(state().activeId).toBe(state().tabs[1].id)
    expect(state().code).toBe('')
  })

  it('탭마다 내용이 따로 유지된다', () => {
    state().addTab()
    state().setCode('SELECT 2;')
    state().selectTab('a')
    expect(state().code).toBe('SELECT 1;')
    state().selectTab(state().tabs[1].id)
    expect(state().code).toBe('SELECT 2;')
  })

  it('appendCode 는 활성 탭 끝에 한 줄 띄워 붙인다', () => {
    state().appendCode('SELECT 2;')
    expect(state().code).toBe('SELECT 1;\n\nSELECT 2;\n')
    state().addTab()
    state().appendCode('SELECT 3;')
    expect(state().code).toBe('SELECT 3;\n')
  })

  it('활성 탭을 닫으면 이웃 탭으로 가고, 마지막 탭은 닫지 않고 비운다', () => {
    state().addTab()
    const second = state().tabs[1].id
    state().closeTab(second)
    expect(state().tabs).toHaveLength(1)
    expect(state().activeId).toBe('a')

    state().closeTab('a')
    expect(state().tabs).toHaveLength(1)
    expect(state().code).toBe('')
  })

  it('이름 변경은 빈 문자열을 무시한다', () => {
    state().renameTab('a', '  매출 분석  ')
    expect(state().tabs[0].name).toBe('매출 분석')
    state().renameTab('a', '   ')
    expect(state().tabs[0].name).toBe('매출 분석')
  })

  it('새 탭 이름은 안 쓰는 가장 작은 번호', () => {
    expect(nextTabName([{ id: 'x', name: '쿼리 1', code: '' }, { id: 'y', name: '쿼리 3', code: '' }])).toBe('쿼리 2')
  })
})
