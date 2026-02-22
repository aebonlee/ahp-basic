# 풍선도움말 시스템 구현 + DB 마이그레이션 실행

> 작업일: 2026-02-22
> 상태: 완료

---

## 1. 풍선도움말(Help Balloon) 시스템 구현

### 배경
원본 imakeit.kr에는 각 섹션마다 `?` 버튼 클릭 시 풍선도움말이 표시되는 help 시스템이 존재.
React 구현에서 누락되어 있어 원본과 동일하게 구현.

### 신규 파일 (3개)
| 파일 | 설명 |
|------|------|
| `src/lib/helpData.js` | 8개 도움말 콘텐츠 데이터 (원본 HTML에서 추출) |
| `src/components/common/HelpButton.jsx` | `?` 버튼 + 풍선 tooltip 컴포넌트 |
| `src/components/common/HelpButton.module.css` | 풍선 스타일 (모바일 반응형 포함) |

### 수정 파일 (5개)
| 파일 | HelpButton 위치 |
|------|----------------|
| `ProjectPanel.jsx` | "시작하기" 버튼 옆 (`projectStart`) |
| `ProjectForm.jsx` | 프로젝트 이름/설명/평가방법 라벨 옆 (3개) |
| `ParticipantPanel.jsx` | 헤더 + 평가자 목록 옆 (2개) |
| `ConsistencyDisplay.jsx` | CR 라벨 옆 (`consistencyCheck`) |
| `PairwiseRatingPage.jsx` | 헤더 영역 (`evalProgress`) |

### 도움말 콘텐츠 (8개)
| helpKey | 제목 |
|---------|------|
| `projectStart` | 시작하기 |
| `projectManage` | 프로젝트 관리 |
| `projectName` | 프로젝트 이름 |
| `projectDesc` | 프로젝트 설명 |
| `evalMethod` | 평가 방법 설정 |
| `evaluatorSelect` | 평가자 선택 |
| `consistencyCheck` | 판단의 타당성 점검 (비일관성비율) |
| `evalProgress` | 평가 진행 |

### 동작
- 클릭 토글, 외부 클릭/ESC 닫기, 풍선 내부 클릭 시 유지
- 모바일: 하단 고정 시트로 표시

---

## 2. Supabase DB 마이그레이션 실행

### 문제
`public.projects` 테이블이 Supabase에 존재하지 않음.
마이그레이션 SQL(`001_user_profiles.sql`)이 미실행 상태였음.

### 해결
Supabase Management API를 통해 전체 테이블 생성 실행:
- `projects`, `criteria`, `alternatives`, `evaluators`
- `pairwise_comparisons`, `brainstorming_items`, `evaluation_signatures`, `orders`

### RLS 순환참조 수정
`projects` ↔ `evaluators` 간 RLS 정책 상호참조로 `infinite recursion` 오류 발생.

**수정 방법**: `SECURITY DEFINER` 헬퍼 함수 도입
```sql
-- RLS 내부에서 상대 테이블 조회 시 RLS를 우회하여 순환 방지
CREATE OR REPLACE FUNCTION public.is_project_owner(p_id UUID) ...
CREATE OR REPLACE FUNCTION public.is_project_evaluator(p_id UUID) ...
```

기존 직접 서브쿼리 정책 → 헬퍼 함수 호출로 변경:
- `projects_evaluator_select` → `public.is_project_evaluator(id)`
- `evaluators_project_owner` → `public.is_project_owner(project_id)`
- `criteria_project_owner` → `public.is_project_owner(project_id)`
- 기타 관련 정책 모두 동일 패턴 적용

### 결과
- `projects` 테이블 정상 접근 확인 (빈 배열 반환, 오류 없음)
- 마이그레이션 SQL 파일에 수정 사항 반영 완료
