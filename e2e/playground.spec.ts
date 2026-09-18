import { expect, test } from '@playwright/test'
import { loadSample, openApp, runInPlayground, schemaTable, setEditor, undoButton } from './helpers'

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
    await loadSample(page, /쇼핑몰/)
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
    await loadSample(page, /쇼핑몰/)
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

  test('끝나지 않는 쿼리 중에도 화면이 반응하고, 중단하면 DB 가 실행 직전 상태로 돌아온다', async ({ page }) => {
    await openApp(page)
    await runInPlayground(page, 'CREATE TABLE keep (id INTEGER); INSERT INTO keep VALUES (1);')
    await expect(schemaTable(page, 'keep')).toBeVisible()

    // 앞 문장은 성공하지만 뒤 문장이 끝나지 않는다. 중단하면 앞 문장의 변경도 함께 사라져야 한다
    await setEditor(page, 'INSERT INTO keep VALUES (2); WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT count(*) FROM c;')
    await page.getByRole('button', { name: '실행', exact: true }).click()
    await expect(page.getByRole('button', { name: '중단' })).toBeVisible()

    // 쿼리가 워커에서 돌기 때문에 다른 메뉴로 이동할 수 있다
    await page.getByRole('link', { name: '설정' }).click()
    await expect(page.getByRole('heading', { name: '설정' })).toBeVisible()
    await page.getByRole('link', { name: '연습장' }).click()

    await page.getByRole('button', { name: '중단' }).click()
    await expect(page.getByText('실행을 중단했습니다.')).toBeVisible()
    await expect(page.getByRole('button', { name: '실행', exact: true })).toBeVisible()

    await runInPlayground(page, 'SELECT count(*) AS n FROM keep;')
    await expect(page.getByRole('cell', { name: '1', exact: true }).last()).toBeVisible()
  })

  test('빈 DB 에서는 시작 카드가 보이고, 샘플을 고르면 테이블이 생기며 카드가 사라진다', async ({ page }) => {
    await openApp(page)
    await expect(page.getByRole('heading', { name: /아직 테이블이 없어요/ })).toBeVisible()
    await page.getByRole('button', { name: /^학교/ }).click()
    await expect(schemaTable(page, 'students')).toBeVisible()
    await expect(page.getByRole('heading', { name: /아직 테이블이 없어요/ })).toHaveCount(0)
  })

  test('테이블 삭제는 실행될 SQL 을 보여 주는 앱 확인창을 거치고, 취소하면 아무 일도 없다', async ({ page }) => {
    await openApp(page)
    await runInPlayground(page, 'CREATE TABLE t (id INTEGER);')
    await page.getByRole('button', { name: '테이블 삭제 (DROP)' }).click()
    const dialog = page.getByRole('dialog', { name: /테이블을 삭제할까요/ })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('DROP TABLE t;')).toBeVisible()
    await dialog.getByRole('button', { name: '취소' }).click()
    await expect(schemaTable(page, 't')).toBeVisible()

    await page.getByRole('button', { name: '테이블 삭제 (DROP)' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click()
    await expect(schemaTable(page, 't')).toHaveCount(0)
    await expect(page.getByText('DROP TABLE t;')).toBeVisible()
  })

  test('실행 이력은 새로고침해도 남는다', async ({ page }) => {
    await openApp(page)
    await runInPlayground(page, 'SELECT 42 AS answer;')
    // 실행이 끝나 이력이 기록된 뒤에 새로고침한다
    await expect(page.getByRole('cell', { name: '42', exact: true })).toBeVisible()
    await page.reload()
    await page.getByRole('button', { name: /히스토리/ }).click()
    // 에디터에도 같은 문장이 남아 있으므로 히스토리 항목(code)으로 좁힌다
    await expect(page.locator('li code', { hasText: 'SELECT 42 AS answer;' })).toBeVisible()
  })
})
