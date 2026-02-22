# AHP Basic 전체 개발 계획서

> 작성일: 2026-02-22
> 프로젝트: AHP Basic (I Make It 재구현)
> 상태: 구현 완료

---

## 1. 프로젝트 개요

I Make It (imakeit.kr) AHP 서비스를 React 18 + Vite + Supabase로 완전 재구현한다.
copy_code/에 9개 페이지 분석 완료 (~85% 커버리지). 전체 기능을 구현한다.

### Supabase 프로젝트
- Project ID: `hcmgdztsgjvzcyxyayaj`
- URL: `https://hcmgdztsgjvzcyxyayaj.supabase.co`
- 대시보드: https://supabase.com/dashboard/project/hcmgdztsgjvzcyxyayaj

### GitHub 저장소
- URL: https://github.com/aebonlee/ahp-basic
- 배포: https://ahp-basic.dreamitbiz.com (GitHub Pages + 커스텀 도메인)

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18 + Vite 5 |
| Routing | React Router DOM 6 (HashRouter - GitHub Pages 호환) |
| State | Context API + useReducer |
| DB/Auth | Supabase (PostgreSQL + Auth + RLS) |
| AHP 계산 | 클라이언트 JavaScript (고유벡터법) |
| 차트 | recharts |
| Excel | xlsx + file-saver |
| 스타일 | CSS Modules + Noto Sans KR |
| 배포 | GitHub Pages |

---

## 3. Phase별 개발 계획

### Phase 1: 프로젝트 초기화 (12 tasks)

React + Vite 프로젝트 생성, 디자인 시스템, 레이아웃 컴포넌트.

**생성 파일:**
```
index.html                            # Vite 엔트리 (Noto Sans KR 링크)
vite.config.js                        # base: '/ahp_basic/'
.env.example                          # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
.gitignore                            # node_modules, dist, .env
src/main.jsx                          # ReactDOM.createRoot
src/App.jsx                           # HashRouter + 라우트 스켈레톤
src/index.css                         # CSS reset + font import + CSS 변수
src/styles/variables.css              # 색상, 간격, 브레이크포인트
src/components/layout/Navbar.jsx      # 헤더 (로고, 모드전환, 로그아웃)
src/components/layout/Footer.jsx      # 푸터
src/components/layout/PageLayout.jsx  # Navbar + content + Footer 래퍼
src/components/common/Button.jsx      # 공통 버튼
src/components/common/Modal.jsx       # 모달 오버레이
src/components/common/LoadingSpinner.jsx
src/components/common/ProgressBar.jsx
src/lib/constants.js                  # 상태코드, 평가방법, RI 테이블, 색상
```

**CSS 변수:**
```css
--color-primary: #0066CC;
--color-pairwise-left: #38d;
--color-pairwise-right: #e77;
--color-pairwise-selected: rgba(30, 250, 200, 0.3);
--color-priority-bar: #3a2;
--color-level-1: #a0a;
--color-level-2: #0aa;
--cell-size-desktop: 30px;
--cell-size-mobile: 17px;
```

---

### Phase 2: 인증 (8 tasks)

Supabase Auth 연동, 로그인/회원가입, 라우트 보호.

**생성 파일:**
```
src/lib/supabaseClient.js              # Supabase 클라이언트 초기화
src/contexts/AuthContext.jsx            # Auth 상태 (user, session, mode, loading)
src/hooks/useAuth.js                    # signIn, signUp, signOut, onAuthStateChange
src/pages/LoginPage.jsx                 # 이메일/비밀번호 로그인
src/pages/SignupPage.jsx                # 회원가입
src/components/common/ProtectedRoute.jsx # 인증 가드
src/components/admin/ModeSwitch.jsx     # 관리자/평가자 모드 전환
```

**인증 흐름:**
- 일반 로그인: `supabase.auth.signInWithPassword()`
- 평가자 초대: `/#/eval/invite/:token` → 자동 로그인
- 세션 유지: `onAuthStateChange` 리스너

---

### Phase 3: 관리자 대시보드 (14 tasks)

프로젝트 CRUD, 평가자 관리, 상태 표시.

**생성 파일:**
```
src/pages/AdminDashboard.jsx            # 메인 대시보드
src/components/admin/ProjectPanel.jsx   # 프로젝트 목록 + 생성폼
src/components/admin/ProjectList.jsx    # 프로젝트 리스트
src/components/admin/ProjectCard.jsx    # 프로젝트 카드 (상태 뱃지)
src/components/admin/ProjectForm.jsx    # 생성/편집 폼
src/components/admin/ParticipantPanel.jsx   # 평가자 목록
src/components/admin/ParticipantForm.jsx    # 평가자 추가 폼
src/components/admin/StateTransitionButton.jsx # 상태 전환
src/contexts/ProjectContext.jsx         # 프로젝트 상태 관리
src/hooks/useProjects.js                # 프로젝트 CRUD
src/hooks/useEvaluators.js              # 평가자 CRUD
```

**프로젝트 상태 흐름:**
```
생성중(2) → 대기중(6) → 평가중(1) → 완료(4)
```

---

### Phase 4: 모델구축 (16 tasks)

계층 트리 에디터 (기준 + 대안). 가장 복잡한 관리자 기능.

**생성 파일:**
```
src/pages/ModelBuilderPage.jsx           # 모델구축 페이지
src/components/model/CriteriaTree.jsx    # 기준 트리 (커스텀 OrgChart)
src/components/model/CriteriaTreeNode.jsx # 재귀 노드
src/components/model/CriteriaForm.jsx    # 기준 추가/편집 패널
src/components/model/AlternativeTree.jsx # 대안 트리
src/components/model/AlternativeForm.jsx # 대안 추가/편집
src/components/model/ModelPreview.jsx    # 전체 모델 미리보기
src/components/model/EvalMethodSelect.jsx # 평가방법 선택 (10/12/20)
src/hooks/useCriteria.js                 # 기준 CRUD + 트리 연산
src/hooks/useAlternatives.js             # 대안 CRUD
```

---

### Phase 5: 브레인스토밍 (10 tasks)

드래그앤드롭 브레인스토밍 보드.

**생성 파일:**
```
src/pages/BrainstormingPage.jsx
src/components/brainstorming/BrainstormingBoard.jsx  # 4개 존
src/components/brainstorming/KeywordZone.jsx         # 드롭 존
src/components/brainstorming/KeywordItem.jsx         # 드래그 아이템
```

---

### Phase 6: AHP 계산 엔진 (8 tasks)

클라이언트 사이드 AHP 알고리즘. Unit test 포함.

**생성 파일:**
```
src/lib/ahpEngine.js            # 핵심: buildMatrix, calculatePriorities, calculateCR
src/lib/ahpBestFit.js           # Best-fit 추천 (5개)
src/lib/ahpAggregation.js       # 다수 평가자 기하평균 집계
src/lib/pairwiseUtils.js        # 매트릭스 유틸, 비교쌍 생성, 페이지 시퀀스
src/lib/sensitivityAnalysis.js
src/hooks/useAhpCalculation.js  # React 래핑 훅
src/lib/__tests__/ahpEngine.test.js
src/lib/__tests__/ahpBestFit.test.js
```

**알고리즘 명세:**
- **고유벡터법 (Power Method)**: 초기 균등벡터 → 행렬곱 → 정규화 → 수렴 (δ<1e-8, max 100회)
- **CR = CI/RI**, CI = (λmax - n)/(n-1), n≤2이면 CR=0
- **RI 테이블**: [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, ...]
- **Best-fit**: 각 셀을 1~9/-1~-9로 변경해보고 CR이 가장 낮아지는 5개 추천

**검증된 테스트 데이터:**
```
자료검색 vs 사고력: 값 4(사고력) → 결과 20% / 80%
데이터분석 vs 수치분석: 값 5(데이터분석) → 결과 83.333% / 16.667%
1차 기준 CR: 0.05787 (통과)
```

---

### Phase 7: 쌍대비교 평가 UI (18 tasks)

17셀 그리드, 실시간 계산, 페이지 네비게이션, Best-fit.

**생성 파일:**
```
src/pages/EvaluatorMainPage.jsx          # 평가방법 소개
src/pages/PairwiseRatingPage.jsx         # 쌍대비교 페이지
src/pages/DirectInputPage.jsx           # 직접입력 페이지
src/components/evaluation/AhpIntroduction.jsx    # 17점 척도 설명
src/components/evaluation/PairwiseGrid.jsx       # 비교행 컨테이너
src/components/evaluation/PairwiseRow.jsx        # 개별 비교행
src/components/evaluation/PairwiseCell.jsx       # 클릭 가능 셀
src/styles/pairwise.module.css                   # 그리드 스타일
src/components/evaluation/PriorityBarChart.jsx   # 실시간 바 차트
src/components/evaluation/ConsistencyDisplay.jsx # CR 표시
src/components/evaluation/BestFitHelper.jsx      # 추천 버튼
src/components/evaluation/PageNavigator.jsx      # 이전/다음
src/components/evaluation/EvaluationProgress.jsx # 진행도
src/components/evaluation/DirectInputPanel.jsx   # 직접입력
src/contexts/EvaluationContext.jsx       # 평가 상태 관리
src/hooks/usePairwiseComparison.js       # 비교 CRUD + 계산 트리거
```

**셀 스타일:**
- 왼쪽(파랑): `linear-gradient(to top, #38d N%, #eee N%)`
- 오른쪽(빨강): `linear-gradient(to top, #e77 N%, #eee N%)`
- 선택: `rgba(30,250,200,0.3)`, border `#009`

---

### Phase 8: 평가결과 + 내보내기 (14 tasks)

종합중요도, CR 테이블, 상세보기, Excel, 평가완료.

**생성 파일:**
```
src/pages/EvalResultPage.jsx
src/components/results/ResultSummary.jsx          # 전체 요약 + 트리
src/components/results/ComprehensiveChart.jsx     # 레벨별 색상 바 차트
src/components/results/ConsistencyTable.jsx       # CR 테이블
src/components/results/DetailView.jsx             # 세부내용 컨테이너
src/components/results/LevelResultView.jsx        # 수준별 기준 중요도
src/components/results/AlternativeResultView.jsx  # 기준별 대안 순위
src/components/results/SignaturePanel.jsx         # 평가완료 + 제출
src/components/results/ExportButtons.jsx          # Excel/Word 다운로드
src/lib/exportUtils.js                            # xlsx + file-saver 래핑
src/styles/results.module.css
```

**평가완료 조건:**
- 모든 셀 완료 (cell_and_total: "10/10")
- 모든 CR < 0.1
- 두 조건 충족 시 "평가 완료" 버튼 활성화

---

### Phase 9: 다수 평가자 집계 + 관리자 결과 (12 tasks)

관리자용 집계 결과, 가중치 조정, 모델확정/평가시작.

**생성 파일:**
```
src/pages/AdminResultPage.jsx            # 관리자 집계 결과
src/pages/ModelConfirmPage.jsx           # 모델확정
src/pages/EvaluatorManagementPage.jsx    # 평가자 초대/관리
src/components/admin/EvaluatorWeightEditor.jsx # 가중치 슬라이더
```

**집계 알고리즘:**
- **가중 기하평균**: a_ij_group = Π(a_ij_k ^ w_k)
- 가중치 조정 UI: 각 평가자별 슬라이더

---

### Phase 10: 고급 기능 (10 tasks)

민감도분석, 워크숍, 자원배분.

**생성 파일:**
```
src/pages/SensitivityPage.jsx
src/components/sensitivity/SensitivityChart.jsx   # recharts LineChart
src/components/sensitivity/WeightSlider.jsx       # 기준별 가중치 슬라이더
src/pages/WorkshopPage.jsx
src/pages/ResourceAllocationPage.jsx
```

---

### Phase 11: 마무리 + 배포 (8 tasks)

반응형 테스트, GitHub Pages 배포.

**생성/수정 파일:**
```
.github/workflows/deploy.yml    # GitHub Actions CI/CD
src/utils/formatters.js          # 숫자/퍼센트 포맷
src/utils/validators.js          # 폼 검증
```

---

## 4. 라우트 구조 (HashRouter)

```
#/login                             LoginPage
#/signup                            SignupPage
#/admin                             AdminDashboard
#/admin/project/:id                 ModelBuilderPage
#/admin/project/:id/brain           BrainstormingPage
#/admin/project/:id/confirm         ModelConfirmPage
#/admin/project/:id/eval            EvaluatorManagementPage
#/admin/project/:id/result          AdminResultPage
#/admin/project/:id/sensitivity     SensitivityPage
#/admin/project/:id/resource        ResourceAllocationPage
#/admin/project/:id/workshop        WorkshopPage
#/eval/invite/:token                평가자 초대 랜딩
#/eval                              EvaluatorMainPage
#/eval/project/:id                  PairwiseRatingPage
#/eval/project/:id/result           EvalResultPage
```

---

## 5. DB 스키마 (Supabase SQL)

### 테이블 목록

| 테이블 | 용도 |
|--------|------|
| projects | 프로젝트 메타 + 상태 |
| criteria | 기준 트리 (재귀 parent_id) |
| alternatives | 대안 트리 |
| evaluators | 평가자 (초대, 가중치) |
| pairwise_comparisons | 쌍대비교 값 (-9~9) |
| evaluation_results | 계산된 중요도 + CR (캐시) |
| brainstorming_items | 브레인스토밍 키워드 |
| direct_input_values | 직접입력 값 |
| evaluation_signatures | 평가완료 서명 |

### RLS 정책
- projects: 소유자 전체 CRUD, 평가자 읽기
- criteria/alternatives: 소유자 CRUD, 평가자 읽기
- pairwise_comparisons: 평가자 본인 CRUD, 소유자 읽기
- evaluation_results: 동일 패턴

---

## 6. 의존성 (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "@supabase/supabase-js": "^2.45.0",
    "recharts": "^2.13.0",
    "xlsx": "^0.18.5",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "jsdom": "^25.0.0"
  }
}
```

---

## 7. 핵심 의존 체인

```
Phase 1 → 2 → 3 → 4 → 7 → 8 → 9 → 10 → 11
                         ↑
Phase 1 → 6 ─────────────┘  (AHP 엔진은 독립 개발 가능)
Phase 4 → 5 (브레인스토밍은 모델구축 이후)
```

---

## 8. 구현 결과 요약

| Phase | 설명 | 상태 |
|-------|------|------|
| 1 | 프로젝트 초기화 + 디자인 | ✅ 완료 |
| 2 | 인증 | ✅ 완료 |
| 3 | 관리자 대시보드 | ✅ 완료 |
| 4 | 모델구축 | ✅ 완료 |
| 5 | 브레인스토밍 | ✅ 완료 |
| 6 | AHP 엔진 | ✅ 완료 (15/15 테스트 통과) |
| 7 | 쌍대비교 UI | ✅ 완료 |
| 8 | 평가결과 | ✅ 완료 |
| 9 | 다수평가자 집계 | ✅ 완료 |
| 10 | 고급 기능 | ✅ 완료 |
| 11 | 마무리 + 배포 | ✅ 완료 |

- **빌드**: `npx vite build` 성공 (~1,105KB 번들)
- **테스트**: `npx vitest run` 15/15 통과
- **총 파일 수**: 170+ 파일 (페이지 18, 컴포넌트 47, 훅 7, 라이브러리 8, 유틸 4, CSS 41, 테스트 2)
- **배포**: https://ahp-basic.dreamitbiz.com (GitHub Pages + 커스텀 도메인)
- **총 커밋 수**: 16 (d0a8d9f ~ bc0f40e)
