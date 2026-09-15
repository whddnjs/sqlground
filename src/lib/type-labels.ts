/** SQLite 타입의 한글 설명 (툴팁용) */
const LABELS: Array<[RegExp, string]> = [
  [/INT/, '정수 (예: 1, 42, -7)'],
  [/CHAR|CLOB|TEXT/, '문자열 (예: \'홍길동\'). 작은따옴표로 감쌉니다'],
  [/REAL|FLOA|DOUB/, '실수 (예: 3.14)'],
  [/NUM|DEC|BOOL|DATE/, '숫자 또는 날짜/불리언. SQLite 는 유연하게 저장합니다'],
  [/BLOB/, '이진 데이터 (파일, 이미지 등)'],
]

export function typeLabel(type: string): string {
  const upper = type.toUpperCase()
  if (upper === '') return '타입 미지정. 어떤 값이든 저장됩니다'
  for (const [re, label] of LABELS) if (re.test(upper)) return label
  return type
}
