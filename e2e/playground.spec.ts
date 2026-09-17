import { expect, test } from '@playwright/test'
import { openApp, runInPlayground, schemaTable, undoButton } from './helpers'

test.describe('연습장', () => {
  test('기본 예시 쿼리가 실행되고 결과와 스키마가 표시된다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: '실행', exact: true }).click()
    await expect(page.getByRole('cell', { name: '민수' })).toBeVisible()
    await expect(schemaTable(page, 'users')).toBeVisible()
  })

  test('조회는 되돌리기를 소모하지 않고, 변경은 되돌릴 수 있다', async ({ page }) => {
    await openApp(page)
    await runInPlayground(page, 'SELECT 1;')
    await runInPlayground(page, 'SELECT 2;')
    await expect(undoButton(page)).toBeDisabled()

    await runInPlayground(page, 'CREATE TABLE t (id INTEGER);')
    await expect(schemaTable(page, 't')).toBeVisible()
    await runInPlayground(page, 'SELECT * FROM t;')
    await expect(undoButton(page)).toBeEnabled()

    await undoButton(page).click()
    await expect(schemaTable(page, 't')).toHaveCount(0)
    await expect(undoButton(page)).toBeDisabled()
  })

  test('새로고침해도 테이블과 쿼리 탭이 유지된다', async ({ page }) => {
    await openApp(page)
    await runInPlayground(page, "CREATE TABLE memo (body TEXT); INSERT INTO memo VALUES ('hello');")
    await page.getByRole('button', { name: '새 쿼리 탭' }).click()
    await expect(page.getByRole('button', { name: '쿼리 2', exact: true })).toBeVisible()
    // 저장은 500ms 디바운스
    await page.waitForTimeout(900)

    await page.reload()
    await expect(schemaTable(page, 'memo')).toBeVisible()
    await expect(page.getByRole('button', { name: '쿼리 2', exact: true })).toBeVisible()
    await runInPlayground(page, 'SELECT body FROM memo;')
    await expect(page.getByRole('cell', { name: 'hello' })).toBeVisible()
  })

  test('여러 번에 나눠 실행한 트랜잭션이 유지된다', async ({ page }) => {
    await openApp(page)
    await runInPlayground(page, 'CREATE TABLE t (id INTEGER);')
    await runInPlayground(page, 'BEGIN;')
    await runInPlayground(page, 'INSERT INTO t VALUES (1);')
    // 자동 저장 타이머가 트랜잭션을 끊지 않아야 한다
    await page.waitForTimeout(900)
    await runInPlayground(page, 'ROLLBACK;')
    await expect(page.getByText('no transaction is active')).toHaveCount(0)
    await runInPlayground(page, 'SELECT count(*) AS n FROM t;')
    await expect(page.getByRole('cell', { name: '0', exact: true })).toBeVisible()
  })

  test('샘플 로드 후 UI 로 테이블을 만들면 생성된 SQL 이 실행된다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: '샘플 로드' }).click()
    await page.getByRole('button', { name: /쇼핑몰/ }).click()
    await expect(schemaTable(page, 'customers')).toBeVisible()

    await page.getByRole('button', { name: '만들기' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder('예: products').fill('reviews')
    await dialog.getByPlaceholder('예: name').nth(1).fill('product_id')
    await dialog.getByRole('combobox').nth(3).selectOption({ label: 'products.id (PK)' })
    await expect(dialog.getByText('REFERENCES products(id)')).toBeVisible()
    await dialog.getByRole('button', { name: '실행' }).click()

    await expect(schemaTable(page, 'reviews')).toBeVisible()
  })

  test('FOREIGN KEY 제약이 걸리고 한글 설명이 나온다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: '샘플 로드' }).click()
    await page.getByRole('button', { name: /쇼핑몰/ }).click()
    await expect(schemaTable(page, 'orders')).toBeVisible()
    await runInPlayground(page, "INSERT INTO orders (customer_id, ordered_at, status) VALUES (999, '2024-01-01', 'paid');")
    await expect(page.getByText('FOREIGN KEY constraint failed')).toBeVisible()
    await expect(page.getByText(/참조하는 행이 없거나/)).toBeVisible()
  })

  test('단일 테이블 조회 결과에서 셀을 고치면 UPDATE 가 실행된다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: '실행', exact: true }).click()
    await runInPlayground(page, 'SELECT * FROM users;')
    await page.getByRole('cell', { name: '민수' }).dblclick()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('철수')
    await page.keyboard.press('Enter')
    await expect(page.getByText("UPDATE users SET name = '철수' WHERE id = 1;")).toBeVisible()
    await expect(page.getByRole('cell', { name: '철수' })).toBeVisible()
  })
})
