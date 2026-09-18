import { expect, test } from '@playwright/test'
import { openApp, setEditor } from './helpers'

test.describe('학습', () => {
  test('예제를 실행하면 결과가 표시되고, 다른 예제를 실행해도 남아 있다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('link', { name: '학습' }).click()
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
    await page.getByRole('link', { name: '학습' }).click()
    const editor = page.locator('.cm-content').first()
    await editor.click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('SELECT * FROM customers WHERE ci')
    await expect(page.getByRole('option', { name: /^city/ })).toBeVisible()
  })

  test('끝나지 않는 예제를 중단하면 학습용 DB 가 샘플 상태로 돌아오고 계속 쓸 수 있다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('link', { name: '학습' }).click()
    await setEditor(page, 'DROP TABLE order_items; WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT count(*) FROM c;')
    await page.getByRole('button', { name: '실행', exact: true }).first().click()
    await page.getByRole('button', { name: '중단' }).click()
    await expect(page.getByText(/실행을 중단했습니다/)).toBeVisible()

    await setEditor(page, 'SELECT count(*) AS n FROM order_items;')
    await page.getByRole('button', { name: '실행', exact: true }).first().click()
    await expect(page.getByRole('columnheader', { name: 'n' })).toBeVisible()
  })

  test('데이터를 바꾸는 예제를 실행하면 표시가 뜨고, 되돌리기를 누르면 사라진다', async ({ page }) => {
    await page.goto('/learn/update-delete')
    await expect(page.getByRole('button', { name: /샘플 데이터 되돌리기/ })).not.toContainText('데이터가 바뀌었어요')

    // 첫 예제: 도서 가격 10% 인상 (UPDATE)
    await page.getByRole('button', { name: '실행', exact: true }).first().click()
    await expect(page.getByText(/이 예제는 학습용 DB 의 데이터를 바꿨어요/).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /샘플 데이터 되돌리기/ })).toContainText('데이터가 바뀌었어요')

    await page.getByRole('button', { name: /샘플 데이터 되돌리기/ }).click()
    await expect(page.getByRole('button', { name: /샘플 데이터 되돌리기/ })).not.toContainText('데이터가 바뀌었어요')
    await expect(page.getByText(/이 예제는 학습용 DB 의 데이터를 바꿨어요/)).toHaveCount(0)
  })

  test('단원 아래 문제 링크로 문제풀이로 이동한다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('link', { name: '학습' }).click()
    await page.getByRole('button', { name: 'WHERE 로 조건 걸기' }).click()
    await page.getByRole('button', { name: /서울 또는 부산 고객/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: /서울 또는 부산 고객/ })).toBeVisible()
  })
})

test.describe('문제풀이', () => {
  test('조회 문제: 오답은 이유를 알려 주고 정답은 해결로 표시된다', async ({ page }) => {
    await page.goto('/problems/p-select-1')
    await expect(page.getByRole('heading', { level: 1, name: '상품 이름과 가격' })).toBeVisible()
    await expect(page.getByText('이 문제에서 쓰는 테이블')).toBeVisible()

    await setEditor(page, 'SELECT name FROM products')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText(/열 개수가 다릅니다/)).toBeVisible()

    await setEditor(page, 'SELECT name, price AS p FROM products ORDER BY price')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText('정답입니다!')).toBeVisible()
    await expect(page.getByText(/^1 \/ \d+ 해결$/)).toBeVisible()
  })

  test('정답 보기는 제출 전에도 열리고, 본 뒤에도 제출과 해결 표시는 그대로 된다', async ({ page }) => {
    await page.goto('/problems/p-select-2')
    await page.getByRole('button', { name: '정답 보기' }).click()
    await expect(page.getByText('SELECT DISTINCT category FROM products', { exact: true })).toBeVisible()
    await setEditor(page, 'SELECT DISTINCT category FROM products')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText('정답입니다!')).toBeVisible()
  })

  test('문제를 열면 관련 테이블이 보이고, 기대 결과는 버튼을 눌러야 나온다', async ({ page }) => {
    await page.goto('/problems/p-case-2')
    // 관련 테이블: 컬럼 한글 설명과 데이터 앞 몇 행은 항상 보인다
    await expect(page.getByText('이 문제에서 쓰는 테이블')).toBeVisible()
    await expect(page.getByText('성적 점수 (0~100). 아직 없으면 NULL')).toBeVisible()
    const expectedPanel = page.getByRole('region', { name: '기대 결과' })
    await expect(expectedPanel).toHaveCount(0)

    // 기대 결과: 힌트와 정답 보기 사이의 버튼. 결과 표만 나오고 쿼리는 숨겨져 있다
    const toggle = page.getByRole('button', { name: '기대 결과', exact: true })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(expectedPanel.getByRole('cell', { name: 'A', exact: true })).toBeVisible()
    await expect(page.getByText(/CASE WHEN score >= 90/)).toHaveCount(0)

    // 패널의 닫기 버튼으로도 접힌다
    await expectedPanel.getByRole('button', { name: '기대 결과 닫기' }).click()
    await expect(expectedPanel).toHaveCount(0)
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  test('정답을 맞히면 모범 답안과 다른 풀이가 나온다', async ({ page }) => {
    await page.goto('/problems/p-where-2')
    await expect(page.getByText('이 문제에서 쓰는 테이블')).toBeVisible()
    await setEditor(page, "SELECT name, city FROM customers WHERE city = '서울' OR city = '부산'")
    await page.getByRole('button', { name: '제출' }).click()
    // 판정은 "내 실행 결과" 패널에, 풀이는 별도 패널에 나온다
    await expect(page.getByRole('region', { name: '내 실행 결과 · 정답' }).getByText('정답입니다!')).toBeVisible()
    const solution = page.getByRole('region', { name: '모범 답안과 다른 풀이' })
    await expect(solution.getByText("WHERE city IN ('서울', '부산')")).toBeVisible()
    await expect(solution.getByText("city = '서울' OR city = '부산'")).toBeVisible()
  })

  test('변경 문제: 채점 후 DB 가 원래대로 돌아간다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('link', { name: '문제풀이' }).click()
    await page.getByRole('button', { name: /품절 상품 재입고/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: /품절 상품 재입고/ })).toBeVisible()

    await setEditor(page, 'UPDATE products SET stock = 100')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText(/값이 다른 행/)).toBeVisible()

    await setEditor(page, 'UPDATE products SET stock = 100 WHERE stock = 0')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText('정답입니다!')).toBeVisible()

    // 다른 문제에서 확인: 재고 0 인 상품이 여전히 있어야 한다
    await page.getByRole('button', { name: /성적이 없는 수강/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: /성적이 없는 수강/ })).toBeVisible()
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
  await page.getByRole('link', { name: '학습' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('문제가 생겼습니다')).toHaveCount(0)
})

test.describe('주소와 이동', () => {
  test('단원과 문제는 주소로 바로 열리고, 새로고침해도 그대로다', async ({ page }) => {
    await page.goto('/learn/join')
    await expect(page.getByRole('heading', { name: 'JOIN 기본' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'JOIN 기본' })).toBeVisible()

    await page.goto('/problems/p-leftjoin-1')
    await expect(page.getByRole('heading', { name: /주문 없는 고객/ })).toBeVisible()
    await expect(page).toHaveURL(/\/problems\/p-leftjoin-1$/)
  })

  test('문제에서 관련 단원으로 갔다가 뒤로 가기를 누르면 문제로 돌아온다', async ({ page }) => {
    await page.goto('/problems/p-join-1')
    await page.getByRole('button', { name: /관련 단원/ }).click()
    await expect(page).toHaveURL(/\/learn\/join$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/problems\/p-join-1$/)
    await expect(page.getByRole('heading', { name: '주문과 고객 이름' })).toBeVisible()
  })

  test('없는 단원 주소는 첫 단원으로, 학습 메뉴는 마지막에 보던 단원으로 간다', async ({ page }) => {
    await page.goto('/learn/nope')
    await expect(page).toHaveURL(/\/learn\/what-is-sql$/)

    await page.goto('/learn/subquery')
    await expect(page.getByRole('heading', { level: 1, name: '서브쿼리' })).toBeVisible()
    await page.getByRole('link', { name: '연습장' }).click()
    await page.getByRole('link', { name: '학습' }).click()
    await expect(page).toHaveURL(/\/learn\/subquery$/)
  })
})
