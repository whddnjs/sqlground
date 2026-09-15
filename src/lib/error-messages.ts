interface Rule {
  pattern: RegExp
  hint(match: RegExpMatchArray): string
}

/** SQLite 원문 에러 → 초보자용 한글 설명. 위에서부터 첫 매치를 사용 */
const RULES: Rule[] = [
  {
    pattern: /no such table: (\S+)/,
    hint: (m) => `'${m[1]}' 테이블이 없습니다. 이름을 확인하거나 CREATE TABLE 로 먼저 만들어 주세요. 왼쪽 목록에서 현재 있는 테이블을 볼 수 있습니다.`,
  },
  {
    pattern: /no such column: (\S+)/,
    hint: (m) => `'${m[1]}' 컬럼이 없습니다. 컬럼 이름 철자를 확인하세요. 문자열 값은 큰따옴표가 아니라 작은따옴표('값')로 감싸야 합니다.`,
  },
  {
    pattern: /table (\S+) already exists/,
    hint: (m) => `'${m[1]}' 테이블이 이미 있습니다. 다른 이름을 쓰거나, 다시 만들려면 DROP TABLE ${m[1]}; 을 먼저 실행하세요.`,
  },
  {
    pattern: /near "([^"]+)": syntax error/,
    hint: (m) => `'${m[1]}' 근처에 문법 오류가 있습니다. 바로 앞 부분의 오타, 빠진 쉼표, 괄호 짝을 확인하세요.`,
  },
  {
    pattern: /incomplete input/,
    hint: () => '문장이 끝나지 않았습니다. 닫는 괄호나 마지막 부분이 빠지지 않았는지 확인하세요.',
  },
  {
    pattern: /NOT NULL constraint failed: (\S+)/,
    hint: (m) => `'${m[1]}' 컬럼은 NOT NULL 이라 값이 꼭 있어야 합니다. INSERT 에 이 컬럼 값을 넣어 주세요.`,
  },
  {
    pattern: /UNIQUE constraint failed: (\S+)/,
    hint: (m) => `'${m[1]}' 컬럼에 같은 값이 이미 있습니다. UNIQUE 또는 PRIMARY KEY 컬럼은 중복될 수 없습니다.`,
  },
  {
    pattern: /FOREIGN KEY constraint failed/,
    hint: () => '참조하는 행이 없거나 아직 참조되고 있습니다. 부모 테이블에 해당 값이 있는지, 삭제 순서가 맞는지 확인하세요.',
  },
  {
    pattern: /CHECK constraint failed/,
    hint: () => '허용되지 않는 값입니다. 테이블의 CHECK 조건을 확인하세요.',
  },
  {
    pattern: /table (\S+) has (\d+) columns but (\d+) values were supplied/,
    hint: (m) => `'${m[1]}' 테이블은 컬럼이 ${m[2]}개인데 값은 ${m[3]}개를 넣었습니다. 값 개수를 맞추거나 INSERT INTO ${m[1]} (컬럼1, 컬럼2) VALUES (...) 처럼 컬럼을 지정하세요.`,
  },
  {
    pattern: /(\d+) values for (\d+) columns/,
    hint: (m) => `지정한 컬럼은 ${m[2]}개인데 값은 ${m[1]}개입니다. 컬럼 목록과 값 개수를 맞춰 주세요.`,
  },
  {
    pattern: /ambiguous column name: (\S+)/,
    hint: (m) => `'${m[1]}' 컬럼이 여러 테이블에 있어 어느 것인지 알 수 없습니다. 테이블명.컬럼명 형태로 적어 주세요.`,
  },
  {
    pattern: /no such function: (\S+)/,
    hint: (m) => `'${m[1]}' 함수는 SQLite 에 없습니다. 철자를 확인하거나 SQLite 에서 지원하는 함수인지 확인하세요.`,
  },
  {
    pattern: /datatype mismatch/,
    hint: () => '컬럼 타입에 맞지 않는 값입니다. INTEGER PRIMARY KEY 컬럼에 문자열을 넣지 않았는지 확인하세요.',
  },
  {
    pattern: /a GROUP BY clause is required before HAVING/,
    hint: () => 'HAVING 은 GROUP BY 와 함께 써야 합니다. 그룹 없이 조건을 걸려면 WHERE 를 사용하세요.',
  },
]

export function explainSqlError(message: string): string | null {
  for (const rule of RULES) {
    const match = message.match(rule.pattern)
    if (match) return rule.hint(match)
  }
  return null
}
