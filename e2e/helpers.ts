import { expect, type Page } from '@playwright/test'

/** 앱을 열고 DB 엔진(WASM)이 준비될 때까지 기다린다. 테스트마다 브라우저 저장소가 비어 있다 */
export async function openApp(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '실행', exact: true })).toBeVisible()
}

/** 화면의 n번째 SQL 에디터 내용을 통째로 바꾼다 */
export async function setEditor(page: Page, sql: string, nth = 0) {
  await page.locator('.cm-content').nth(nth).fill(sql)
  // 자동완성 팝업이 떠 있으면 닫는다
  await page.keyboard.press('Escape')
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
