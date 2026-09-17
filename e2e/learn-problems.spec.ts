import { expect, test } from '@playwright/test'
import { openApp, setEditor } from './helpers'

test.describe('학습', () => {
  test('예제를 실행하면 결과가 표시되고, 다른 예제를 실행해도 남아 있다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: '학습' }).click()
    await page.getByRole('button', { name: /CREATE TABLE, 타입, 제약/ }).click()

    // 구조를 바꾸는 예제. 실행 후 화면이 다시 그려져도 결과가 사라지면 안 된다 (회귀 방지)
    await page.getByRole('button', { name: '실행', exact: true }).nth(0).click()
    await expect(page.getByText(/실행 완료/).first()).toBeVisible()
    await page.getByRole('button', { name: '실행', exact: true }).nth(1).click()
    await expect(page.getByText('CHECK constraint failed')).toBeVisible()
    await expect(page.getByText(/실행 완료/).first()).toBeVisible()
  })

  test('예제 에디터에서 테이블과 컬럼이 자동완성된다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: '학습' }).click()
    const editor = page.locator('.cm-content').first()
    await editor.click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('SELECT * FROM customers WHERE ci')
    await expect(page.getByRole('option', { name: /^city/ })).toBeVisible()
  })

  test('단원 아래 문제 링크로 문제풀이로 이동한다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: '학습' }).click()
    await page.getByRole('button', { name: 'WHERE 로 조건 걸기' }).click()
    await page.getByRole('button', { name: /5만원 이상 전자기기/ }).click()
    await expect(page.getByRole('heading', { name: /5만원 이상 전자기기/ })).toBeVisible()
  })
})

test.describe('문제풀이', () => {
  test('조회 문제: 오답은 이유를 알려 주고 정답은 해결로 표시된다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: '문제풀이' }).click()
    await expect(page.getByRole('heading', { name: '상품 이름과 가격' })).toBeVisible()

    await setEditor(page, 'SELECT name FROM products')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText(/열 개수가 다릅니다/)).toBeVisible()

    await setEditor(page, 'SELECT name, price AS p FROM products ORDER BY price')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText('정답입니다!')).toBeVisible()
    await expect(page.getByText(/^1 \/ \d+ 해결$/)).toBeVisible()
  })

  test('변경 문제: 채점 후 DB 가 원래대로 돌아간다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: '문제풀이' }).click()
    await page.getByRole('button', { name: /품절 상품 재입고/ }).click()

    await setEditor(page, 'UPDATE products SET stock = 100')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText(/값이 다른 행/)).toBeVisible()

    await setEditor(page, 'UPDATE products SET stock = 100 WHERE stock = 0')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText('정답입니다!')).toBeVisible()

    // 다른 문제에서 확인: 재고 0 인 상품이 여전히 있어야 한다
    await page.getByRole('button', { name: /성적이 없는 수강/ }).click()
    await setEditor(page, 'SELECT count(*) AS n FROM products WHERE stock = 0')
    await page.getByRole('button', { name: '실행', exact: true }).click()
    await expect(page.getByRole('cell', { name: '1', exact: true }).last()).toBeVisible()
  })
})

test('브라우저 저장값이 깨져 있어도 학습 화면이 정상 표시된다', async ({ page }) => {
  await openApp(page)
  // 형식이 틀린 값과 존재하지 않는 단원을 저장해 둬도 기본값으로 대체돼야 한다
  await page.evaluate(() => localStorage.setItem('sqlground:learn', JSON.stringify({ completed: 5, lastLesson: 'nope' })))
  await page.reload()
  await page.getByRole('button', { name: '학습' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('문제가 생겼습니다')).toHaveCount(0)
})
