import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { loadSample, openApp, schemaTable } from './helpers'

/**
 * 주요 화면을 axe 로 점검한다 (WCAG 2.1 AA + 권장 사항).
 * 색 대비는 토큰 값에 달려 있으므로 라이트·다크를 모두 본다.
 */
const PAGES = ['/', '/learn/where', '/problems/p-where-2', '/settings']

for (const dark of [false, true]) {
  test(`접근성 위반이 없다 (${dark ? '다크' : '라이트'})`, async ({ page }) => {
    test.setTimeout(60_000)
    await openApp(page)
    await loadSample(page, /쇼핑몰/)
    await expect(schemaTable(page, 'customers')).toBeVisible()
    const found: string[] = []
    for (const path of PAGES) {
      await page.goto(path)
      await page.evaluate((d) => document.documentElement.classList.toggle('dark', d), dark)
      if (path.startsWith('/problems')) {
        // 힌트·기대 결과·판정 패널까지 열어 둔 상태
        await page.getByRole('button', { name: '힌트' }).click()
        await page.getByRole('button', { name: '기대 결과' }).click()
        await page.getByRole('button', { name: '제출' }).click()
        await expect(page.getByRole('region', { name: /내 실행 결과/ })).toBeVisible()
      }
      // 색 전환 애니메이션이 끝난 뒤에 재야 한다
      await page.waitForTimeout(600)
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze()
      for (const v of r.violations)
        for (const n of v.nodes) {
          // CodeMirror 의 스크롤 영역: 안의 contenteditable 이 키보드로 닿지만 axe 는 이를 세지 않는다 (알려진 오탐)
          if (v.id === 'scrollable-region-focusable' && n.target.join(' ').includes('.cm-scroller')) continue
          found.push(`${path} ${v.id}: ${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1] ?? ''}`)
        }
    }
    expect(found, found.join('\n')).toEqual([])
  })
}
