/** 브랜드 마크. 파비콘(public/favicon.svg)과 같은 모양 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="sqlground-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#sqlground-mark)" />
      <g fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round">
        <ellipse cx="32" cy="21" rx="15" ry="6" />
        <path d="M17 21v22c0 3.3 6.7 6 15 6s15-2.7 15-6V21" />
        <path d="M17 32c0 3.3 6.7 6 15 6s15-2.7 15-6" />
      </g>
    </svg>
  )
}
