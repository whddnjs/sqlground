import type { Preset } from './preset'

export const COMPANY_PRESET: Preset = {
  id: 'company',
  name: '회사',
  description: '부서, 직원 2개 테이블. 자기 참조(상사), NULL 허용 FK, 실수 급여, 윈도우 함수·재귀 CTE 연습용',
  tables: ['departments', 'employees'],
  descriptions: {
    'departments.id': '부서 번호',
    'departments.name': '부서 이름',
    'departments.location': '근무지',
    'employees.id': '사번',
    'employees.name': '직원 이름',
    'employees.department_id': '소속 부서 (departments.id 참조). 미배정이면 NULL',
    'employees.manager_id': '직속 상사 (employees.id 참조, 자기 참조). 대표는 NULL',
    'employees.title': '직함',
    'employees.salary': '연봉 (만원, 소수 가능)',
    'employees.hire_date': '입사일 (YYYY-MM-DD)',
    'employees.bio': '자기소개 한 줄',
  },
  sql: `DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
  id       INTEGER PRIMARY KEY,
  name     TEXT NOT NULL UNIQUE,
  location TEXT
);

CREATE TABLE employees (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  manager_id    INTEGER REFERENCES employees(id),
  title         TEXT NOT NULL,
  salary        REAL NOT NULL CHECK (salary > 0),
  hire_date     TEXT NOT NULL,
  bio           TEXT
);

INSERT INTO departments (name, location) VALUES
  ('개발', '서울 본사 5층'),
  ('디자인', '서울 본사 4층'),
  ('마케팅', '서울 본사 3층'),
  ('영업', '부산 지사'),
  ('인사', '서울 본사 2층');

INSERT INTO employees (name, department_id, manager_id, title, salary, hire_date, bio) VALUES
  ('박대표', NULL, NULL, 'CEO', 12000.0, '2015-03-02', '회사를 창업했다. 커피와 등산을 좋아한다.'),
  ('김개발', 1, 1, '개발팀장', 8200.0, '2016-01-11', '백엔드 15년차. 코드 리뷰에 진심이다.'),
  ('이디자', 2, 1, '디자인팀장', 7400.5, '2016-06-20', '브랜드 디자인 출신. 타이포그래피 덕후.'),
  ('최마케', 3, 1, '마케팅팀장', 7100.0, '2017-02-01', '데이터 기반 마케팅을 지향한다.'),
  ('정영업', 4, 1, '영업팀장', 7600.0, '2016-09-05', '부산 지사를 처음부터 키웠다.'),
  ('강인사', 5, 1, '인사팀장', 6900.0, '2018-04-16', '채용과 조직문화를 담당한다.'),
  ('조프론', 1, 2, '프론트엔드 개발자', 5600.0, '2019-03-04', 'React 와 접근성에 관심이 많다.'),
  ('윤백엔', 1, 2, '백엔드 개발자', 5900.0, '2018-11-12', 'DB 튜닝이 취미. SQL 을 사랑한다.'),
  ('장데브', 1, 2, '백엔드 개발자', 4800.0, '2021-07-01', '신입으로 입사해 빠르게 성장 중.'),
  ('임인프', 1, 2, 'DevOps 엔지니어', 6300.0, '2019-10-21', '쿠버네티스와 자동화를 담당한다.'),
  ('한주니', 1, 8, '주니어 개발자', 4200.0, '2023-01-09', '윤백엔의 멘티. 첫 직장.'),
  ('오유엑', 2, 3, 'UX 디자이너', 5200.0, '2019-05-13', '사용자 인터뷰를 즐긴다.'),
  ('서유아', 2, 3, 'UI 디자이너', 4900.0, '2020-08-24', '일러스트도 그린다.'),
  ('신콘텐', 3, 4, '콘텐츠 마케터', 4600.0, '2020-02-10', '블로그와 뉴스레터를 운영한다.'),
  ('권퍼포', 3, 4, '퍼포먼스 마케터', 5100.0, '2019-12-02', '광고 집행과 분석을 맡는다.'),
  ('황영일', 4, 5, '영업 담당', 5300.0, '2018-03-19', '경남 지역 고객을 담당한다.'),
  ('안영이', 4, 5, '영업 담당', 5000.0, '2019-08-26', '수도권 대형 고객사 담당.'),
  ('송영삼', 4, 5, '영업 담당', 4400.0, '2022-04-04', '신규 거래처 개척이 주 업무.'),
  ('배채용', 5, 6, '채용 담당', 4700.0, '2020-10-05', '기술직 채용을 전담한다.'),
  ('노총무', 5, 6, '총무', 4300.0, '2021-02-15', '사무실 살림을 챙긴다.'),
  ('문신입', NULL, 1, '인턴', 3000.0, '2024-07-01', '아직 부서 배정 전. 여러 팀을 돌며 배우는 중.'),
  ('류데이', 1, 8, '데이터 엔지니어', 6100.0, '2020-05-18', '파이프라인과 데이터 웨어하우스를 만든다.');`,
}
