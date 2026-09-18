/** 화면 주소. 링크 공유·뒤로 가기·새로고침이 동작하도록 화면과 단원·문제마다 URL 을 둔다 */
export const routes = {
  playground: '/',
  learn: '/learn',
  lesson: (id: string) => `/learn/${id}`,
  problems: '/problems',
  problem: (id: string) => `/problems/${id}`,
  settings: '/settings',
} as const
