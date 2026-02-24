# 2026-02-24 — 설문 설계 구글 폼 스타일 개편 + DB 마이그레이션 수정

> **날짜**: 2026-02-24
> **작업 시간**: ~1시간
> **변경 파일**: 5개 (코드) + 1개 (개발일지)

---

## 작업 개요

이전 커밋(`ac60c04`)에서 인구통계학적 설문 기능을 구현했으나 두 가지 문제를 해결:
1. DB 마이그레이션 RLS 정책이 기존 패턴(`is_project_owner()`)과 불일치 → 수정
2. 설문 설계 UI를 구글 폼 스타일로 전면 개편 + 기본 인구통계 질문 템플릿 제공

---

## 변경 내역

### 1. DB 마이그레이션 RLS 수정 (`004_survey_tables.sql`)

| 변경 전 | 변경 후 |
|---------|---------|
| `FOR ALL USING (subquery)` | `SELECT/INSERT/UPDATE/DELETE` 개별 분리 |
| 직접 서브쿼리 | `public.is_project_owner(project_id)` 함수 사용 |
| 평가자 정책 2개 | 평가자 `SELECT/INSERT/UPDATE/DELETE` + `WITH CHECK` 명시 |
| 실행 안내 없음 | 파일 상단에 SQL Editor 수동 실행 안내 주석 |

> 기존 003_fix_all_rls.sql 패턴과 100% 일치하도록 수정

### 2. SurveyBuilderPage 구글 폼 스타일 전면 개편

**구조 변경:**
```
SurveyBuilderPage
├── 타이틀 카드 (상단 4px primary 컬러 배너)
│   ├── 연구 소개 textarea
│   └── 동의서 textarea
├── 기본 질문 템플릿 로드 버튼 (질문 없을 때)
├── 질문 카드 목록 (구글 폼 스타일)
│   └── QuestionCard
│       ├── 좌측 4px 컬러 바 (활성 시 primary)
│       ├── 질문 텍스트 + 유형 드롭다운
│       ├── 미리보기 영역 (비활성) / 옵션 편집기 (활성)
│       └── 하단 바 (복제/삭제/이동 + 필수 토글)
└── 플로팅 추가 버튼
```

**주요 기능:**
- 질문 클릭 시 활성 카드 — 좌측 파란 바 강조 + 더 큰 그림자
- 비활성 카드에서 유형별 미리보기 (라디오 dot, 체크박스 square, 리커트 가로 배치 등)
- 기본 인구통계 질문 템플릿 11개 원클릭 로드
- 질문 복제 기능 추가

**기본 인구통계 질문 템플릿 (11개):**

| # | 질문 | 유형 |
|:-:|------|------|
| 1 | 성별 | radio (남성/여성/기타) |
| 2 | 연령대 | dropdown (20대~60대 이상) |
| 3 | 최종 학력 | dropdown (고졸 이하~박사) |
| 4 | 직업 | short_text |
| 5 | 전문 분야 | short_text |
| 6 | 관련 경력 | dropdown (5년 미만~20년 이상) |
| 7 | 소속 기관 유형 | radio (학계/산업계/공공기관/연구기관/기타) |
| 8 | 전문성 자가 평가 | likert (매우 낮음~매우 높음) |
| 9 | AHP 평가 경험 | radio (있음/없음) |
| 10 | 소속 기관명 | short_text |
| 11 | 연락처 | short_text |

### 3. EvalPreSurveyPage 구글 폼 응답 스타일 개선

| 항목 | 변경 내용 |
|------|-----------|
| 질문 카드 | 독립 카드 + 좌측 4px primary 컬러 바 |
| 메인 카드 | 상단 4px primary 바 추가 |
| 리커트 척도 | 가로 바 형태 + 선택 시 primary 배경/흰색 텍스트 |
| 텍스트 입력 | border-bottom only 스타일 (구글 폼 일관성) |
| 모바일 | 리커트 세로 스택 전환 |

---

## 수정 파일 목록

| 파일 | 변경량 | 설명 |
|------|:------:|------|
| `supabase/migrations/004_survey_tables.sql` | +122/-85 | RLS 개별 분리 + is_project_owner 패턴 |
| `src/pages/SurveyBuilderPage.jsx` | +373/-254 | 구글 폼 스타일 전면 개편 + 템플릿 |
| `src/pages/SurveyBuilderPage.module.css` | +537/-257 | 구글 폼 CSS (타이틀/질문/미리보기/하단바) |
| `src/pages/EvalPreSurveyPage.jsx` | +152/-140 | 카드 스타일 개선 |
| `src/pages/EvalPreSurveyPage.module.css` | +160/-95 | 좌측 바 + 리커트 가로 바 |
| **합계** | **+969/-381** | |

---

## 검증

- [x] `npx vite build` — 빌드 성공 (1,197KB)
- [ ] Supabase SQL Editor에서 마이그레이션 수동 실행 필요
- [ ] 설문 설계 페이지: 기본 템플릿 로드 → 질문 CRUD → 유형 변경 → 미리보기
- [ ] 평가자 사전설문: 구글 폼 스타일 응답 UI 확인
