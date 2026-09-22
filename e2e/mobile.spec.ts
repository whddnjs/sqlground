import { expect, test } from '@playwright/test'

// 폰 폭. 연습장·문제풀이는 넓은 화면용이지만 깨지지 않아야 하고, 학습은 읽고 예제를 실행할 수 있어야 한다
test.use({ viewport: { width: 390, height: 844 } })

test.describe('폰 폭', () => {
  test('메뉴가 아래 탭으로 보이고 연습장에 안내가 뜬다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('연습장은 넓은 화면에서 쓰기 좋습니다')).toBeVisible()
    const nav = page.getByRole('navigation')
    const box = await nav.boundingBox()
    expect(box!.y).toBeGreaterThan(700)
    // 가로로 넘치지 않는다
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })

  test('학습: 목차는 버튼으로 열고, 단원을 고르면 닫히며, 예제가 실행된다', async ({ page }) => {
    await page.goto('/learn/where')
    await expect(page.getByRole('heading', { level: 1, name: 'WHERE 로 조건 걸기' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: '단원 목록' })).toBeHidden()

    await page.getByRole('button', { name: '단원 목록' }).click()
    await page.getByRole('complementary', { name: '단원 목록' }).getByRole('button', { name: 'NULL 다루기' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'NULL 다루기' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: '단원 목록' })).toBeHidden()

    await page.getByRole('button', { name: '실행', exact: true }).first().click()
    await expect(page.getByRole('columnheader', { name: 'score' })).toBeVisible()
  })

  test('문제풀이: 문제 목록을 열어 다른 문제로 옮긴다', async ({ page }) => {
    await page.goto('/problems/p-select-1')
    await page.getByRole('button', { name: '문제 목록' }).click()
    await page.getByRole('complementary', { name: '문제 목록' }).getByRole('button', { name: '카테고리 목록' }).click()
    await expect(page.getByRole('heading', { level: 1, name: '카테고리 목록' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: '문제 목록' })).toBeHidden()
  })
})
