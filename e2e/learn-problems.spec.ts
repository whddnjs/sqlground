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
    // 네 번째 예제가 CHECK 제약을 어기는 INSERT (그 앞 둘은 typeof 예제)
    await page.getByRole('button', { name: '실행', exact: true }).nth(3).click()
    await expect(page.getByText('CHECK constraint failed')).toBeVisible()
    await expect(page.getByText(/실행 완료/).first()).toBeVisible()
  })

  test('검색은 본문 내용으로도 단원을 찾고 맞은 곳을 보여 준다', async ({ page }) => {
    await page.goto('/learn/select')
    const list = page.getByRole('complementary', { name: '단원 목록' })
    await page.getByPlaceholder(/찾기/).fill('ambiguous')
    await expect(list.getByRole('button', { name: /JOIN 기본/ })).toBeVisible()
    await expect(list.getByText(/ambiguous column name/)).toBeVisible()
    await expect(list.getByRole('button', { name: /SELECT 기본/ })).toBeHidden()
    await page.getByPlaceholder(/찾기/).fill('zzzz없는말')
    await expect(list.getByText('검색 결과가 없습니다.')).toBeVisible()
  })

  test('본문의 마크다운 표가 표로 그려진다', async ({ page }) => {
    await page.goto('/learn/where')
    const table = page.locator('.lesson-body table').first()
    await expect(table).toBeVisible()
    await expect(table.getByRole('columnheader', { name: '연산자' })).toBeVisible()
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

  test('끝나지 않는 예제는 한도(10초)가 지나면 저절로 중단되고 계속 쓸 수 있다', async ({ page }) => {
    test.setTimeout(45_000)
    await openApp(page)
    await page.getByRole('link', { name: '학습' }).click()
    await setEditor(page, 'WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT count(*) FROM c;')
    await page.getByRole('button', { name: '실행', exact: true }).first().click()
    await expect(page.getByRole('button', { name: '중단' })).toBeVisible()
    await expect(page.getByText(/실행 시간이 10초를 넘어 중단했습니다/)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: '중단' })).toBeHidden()

    await setEditor(page, 'SELECT count(*) AS n FROM products;')
    await page.getByRole('button', { name: '실행', exact: true }).first().click()
    await expect(page.getByRole('columnheader', { name: 'n' })).toBeVisible()
  })

  test('끝나지 않는 예제를 중단하면 학습용 DB 가 샘플 상태로 돌아오고 계속 쓸 수 있다', async ({ page }) => {
    await openApp(page)
    await page.getByRole('link', { name: '학습' }).click()
    await setEditor(page, 'DROP TABLE order_items; WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT count(*) FROM c;')
    await page.getByRole('button', { name: '실행', exact: true }).first().click()
    await page.getByRole('button', { name: '중단' }).click()
    // 중단은 워커를 새로 띄우고 복구 지점을 다시 싣는다. 다른 테스트와 함께 돌 때는 몇 초 걸릴 수 있다
    await expect(page.getByText(/실행을 중단했습니다/)).toBeVisible({ timeout: 15_000 })

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

    // 오답 뒤에 그냥 실행하면 지난 판정이 지워지고 결과 패널이 기본 상태로 돌아온다
    await page.getByRole('button', { name: '실행', exact: true }).click()
    await expect(page.getByRole('region', { name: '내 실행 결과', exact: true })).toBeVisible()
    await expect(page.getByText(/열 개수가 다릅니다/)).toBeHidden()

    await setEditor(page, 'SELECT name, price AS p FROM products ORDER BY price')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText('정답입니다!')).toBeVisible()
    await expect(page.getByText(/^1 \/ \d+ 해결$/)).toBeVisible()

    // 진행도: 장별 해결 수와 다음 문제 버튼
    await expect(page.getByRole('progressbar', { name: '문제 해결 진행도' })).toHaveAttribute('aria-valuenow', '1')
    await expect(page.getByRole('button', { name: /^다음 문제: 카테고리 목록/ })).toBeVisible()

    // 정답 뒤에 다시 실행해도 모범 답안은 닫히지 않는다
    await page.getByRole('button', { name: '실행', exact: true }).click()
    await expect(page.getByRole('region', { name: '내 실행 결과', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: /^모범 답안/ })).toBeVisible()
  })

  test('종합 문제는 목록 끝 "종합 문제" 장에 원래 장 이름으로 나뉘어 있고 관련 단원이 여러 개 보이며, 학습의 장 마지막 단원에서도 이어진다', async ({ page }) => {
    await page.goto('/problems/p-mix-select-1')
    await expect(page.getByRole('heading', { level: 1, name: '하반기 주문 현황판' })).toBeVisible()
    const group = page.getByRole('list', { name: '종합 문제 · 데이터 조회' })
    await expect(group.getByText('데이터 조회', { exact: true })).toBeVisible()
    await expect(group.getByRole('button')).toHaveCount(3)
    // 단원별 묶음에는 종합 문제가 섞이지 않는다
    await expect(page.getByRole('list', { name: '데이터 조회 · WHERE 로 조건 걸기' }).getByRole('button')).toHaveCount(3)
    for (const name of ['WHERE 로 조건 걸기', 'CASE 로 값 분기하기', '정렬과 개수 제한']) {
      await expect(page.getByRole('button', { name: new RegExp(`^${name}`) }).last()).toBeVisible()
    }

    // 데이터 조회 장의 마지막 단원(CASE)에서 종합 문제 목록이 보인다
    await page.goto('/learn/case')
    await expect(page.getByRole('heading', { level: 2, name: '데이터 조회 종합 문제' })).toBeVisible()
    await page.getByRole('button', { name: '재고 금액 상위 5개 상품' }).click()
    await expect(page.getByRole('heading', { level: 1, name: '재고 금액 상위 5개 상품' })).toBeVisible()
    // 마지막이 아닌 단원에는 없다
    await page.goto('/learn/where')
    await expect(page.getByRole('heading', { level: 2, name: /종합 문제/ })).toBeHidden()
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

  test('다음 문제로 옮겨도 문제 목록 스크롤이 맨 위로 돌아가지 않고 현재 문제가 보인다', async ({ page }) => {
    await page.goto('/problems/p-join-4')
    await expect(page.getByRole('heading', { level: 1, name: '주문마다 고객 이름 붙이기' })).toBeVisible()
    const nav = page.getByRole('navigation', { name: '문제' })
    // 목록 중간의 문제라 열자마자 그 자리까지 스크롤돼 있다
    await expect.poll(() => nav.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    const before = await nav.evaluate((el) => el.scrollTop)

    await page.getByRole('button', { name: /^주문과 고객 이름/ }).last().click()
    await expect(page.getByRole('heading', { level: 1, name: '주문과 고객 이름' })).toBeVisible()
    expect(await nav.evaluate((el) => el.scrollTop)).toBeGreaterThanOrEqual(before)
    const item = nav.getByRole('button', { name: /^주문과 고객 이름/ })
    const [navBox, itemBox] = [await nav.boundingBox(), await item.boundingBox()]
    expect(itemBox!.y).toBeGreaterThanOrEqual(navBox!.y)
    expect(itemBox!.y + itemBox!.height).toBeLessThanOrEqual(navBox!.y + navBox!.height)
  })

  test('문제에서 관련 단원으로 갔다가 뒤로 가기를 누르면 문제로 돌아온다', async ({ page }) => {
    await page.goto('/problems/p-join-1')
    // 관련 단원은 단원 이름 버튼 목록이다
    await page.getByRole('button', { name: 'JOIN 기본' }).click()
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
