import { expect, type Page } from '@playwright/test'

/** 앱을 열고 DB 엔진(WASM)이 준비될 때까지 기다린다. 테스트마다 브라우저 저장소가 비어 있다 */
export async function openApp(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '실행', exact: true })).toBeVisible()
}

/**
 * 화면의 n번째 SQL 에디터 내용을 통째로 바꾼다.
 * 에디터가 막 만들어진 직후(다른 테스트와 함께 돌아 느릴 때)에는 입력이 React 상태로 이어지기 전에
 * 원래 값으로 되돌아가는 일이 있어, 내용이 남았는지 확인하고 아니면 다시 채운다.
 */
export async function setEditor(page: Page, sql: string, nth = 0) {
  const editor = page.locator('.cm-content').nth(nth)
  const head = sql.replace(/\s+/g, ' ').slice(0, 24)
  for (let attempt = 0; attempt < 4; attempt++) {
    await editor.fill(sql)
    // 자동완성 팝업이 떠 있으면 닫는다
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
    if ((await editor.innerText()).replace(/\s+/g, ' ').includes(head)) return
  }
  throw new Error(`에디터에 입력이 남지 않습니다: ${head}`)
}

export async function runInPlayground(page: Page, sql: string) {
  await setEditor(page, sql)
  await page.getByRole('button', { name: '실행', exact: true }).click()
}

export const undoButton = (page: Page) => page.getByRole('button', { name: '되돌리기' })
export const schemaTable = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(`^${name}`) })

/** 헤더의 샘플 로드 메뉴에서 샘플을 고른다. 시작 카드에도 같은 이름의 버튼이 있어 헤더로 범위를 좁힌다 */
export async function loadSample(page: Page, name: RegExp) {
  await page.getByRole('button', { name: '샘플 로드' }).click()
  await page.locator('header').getByRole('button', { name }).click()
}
