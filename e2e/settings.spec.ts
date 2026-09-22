import { expect, test } from '@playwright/test'
import { setEditor } from './helpers'

test.describe('설정', () => {
  test('진행 기록 초기화: 학습 완료 표시와 문제 해결 기록을 따로 지운다', async ({ page }) => {
    // 기록 만들기: 단원 하나 완료, 문제 하나 해결
    await page.goto('/learn/select')
    await page.getByRole('button', { name: '완료로 표시' }).click()
    await expect(page.getByText('1 / 23 완료')).toBeVisible()
    await page.goto('/problems/p-select-1')
    await expect(page.getByRole('heading', { level: 1, name: '상품 이름과 가격' })).toBeVisible()
    await setEditor(page, 'SELECT name, price FROM products')
    await page.getByRole('button', { name: '제출' }).click()
    await expect(page.getByText('정답입니다!')).toBeVisible()

    await page.goto('/settings')
    const learnBtn = page.getByRole('button', { name: /학습 완료 표시 초기화/ })
    const problemBtn = page.getByRole('button', { name: /문제 해결 기록 초기화/ })
    await expect(learnBtn).toContainText('1 / 23 완료')
    await expect(problemBtn).toContainText(/1 \/ \d+ 해결/)

    // 취소하면 그대로
    await learnBtn.click()
    await page.getByRole('button', { name: '취소' }).click()
    await expect(learnBtn).toContainText('1 / 23 완료')

    // 학습만 지워도 문제 기록은 남는다
    await learnBtn.click()
    await page.getByRole('button', { name: '초기화', exact: true }).click()
    await expect(learnBtn).toContainText('0 / 23 완료')
    await expect(learnBtn).toBeDisabled()
    await expect(problemBtn).toContainText(/1 \/ \d+ 해결/)

    await problemBtn.click()
    await expect(page.getByText(/작성해 둔 답안/)).toBeVisible()
    await page.getByRole('button', { name: '초기화', exact: true }).click()
    await expect(problemBtn).toContainText(/0 \/ \d+ 해결/)
    await expect(problemBtn).toBeDisabled()

    // 새로고침해도 지워진 상태
    await page.reload()
    await expect(page.getByRole('button', { name: /학습 완료 표시 초기화/ })).toContainText('0 / 23 완료')
  })
})
