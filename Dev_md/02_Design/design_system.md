# AHP Basic - 디자인 시스템

> 최종 갱신: 2026-03-07 | 소스: `src/styles/variables.css`

## 1. 디자인 원칙

- CSS Custom Properties(변수) 기반 토큰 시스템
- CSS Modules로 컴포넌트별 스타일 격리 (78개 모듈)
- Light/Dark 테마 완전 지원 (`[data-theme="dark"]`)
- 모바일 우선 반응형 (768px 브레이크포인트)

## 2. 컬러 팔레트

### Brand Colors

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--color-primary` | `#0f2b5b` | `#60a5fa` | 주요 액션, 헤더 |
| `--color-primary-light` | `#3b82f6` | `#93c5fd` | 호버, 보조 강조 |
| `--color-primary-dark` | `#0a1f42` | `#3b82f6` | 진한 배경 |
| `--color-primary-hover` | `#1a3f7a` | `#3b82f6` | 버튼 호버 |
| `--color-primary-bg` | `#f0f4fa` | `rgba(30,64,175,0.15)` | 연한 배경 |
| `--color-primary-surface` | `#dbeafe` | `rgba(30,64,175,0.2)` | 카드 배경 |

### Accent Colors

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-accent` | `#f59e0b` | Warm Amber 강조 |
| `--color-accent-light` | `#fbbf24` | 밝은 강조 |
| `--color-accent-dark` | `#d97706` | 진한 강조 |

### Status Colors

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-creating` | `#94a3b8` | 생성 중 |
| `--color-waiting` | `#f59e0b` | 대기 |
| `--color-evaluating` | `#10b981` | 평가 중 |
| `--color-completed` | `#0f2b5b` | 완료 |
| `--color-danger` | `#e11d48` | 위험/삭제 |
| `--color-success` | `#059669` | 성공 |
| `--color-warning` | `#f59e0b` | 경고 |

### Level Colors (결과 시각화)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-level-1` | `#0f2b5b` | 1레벨 기준 |
| `--color-level-2` | `#0891b2` | 2레벨 기준 |
| `--color-level-3` | `#d97706` | 3레벨 기준 |
| `--color-level-4` | `#e11d48` | 4레벨 기준 |
| `--color-level-5` | `#059669` | 5레벨 기준 |

### Feature Colors (워크플로우 4단계)

| 토큰 | 값 | 배경 |
|------|-----|------|
| `--color-feature-1` | `#2563eb` | `#eff6ff` |
| `--color-feature-2` | `#7c3aed` | `#f5f3ff` |
| `--color-feature-3` | `#0891b2` | `#ecfeff` |
| `--color-feature-4` | `#059669` | `#ecfdf5` |

### UI Foundation

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--color-bg` | `#f8fafc` | `#0f172a` | 페이지 배경 |
| `--color-bg-alt` | `#f1f5f9` | `#1e293b` | 대체 배경 |
| `--color-surface` | `#ffffff` | `#1e293b` | 카드/패널 |
| `--color-border` | `#e2e8f0` | `#334155` | 테두리 |
| `--color-text` | `#0f172a` | `#f1f5f9` | 본문 텍스트 |
| `--color-text-light` | `#475569` | `#94a3b8` | 보조 텍스트 |
| `--color-text-muted` | `#64748b` | `#64748b` | 비활성 텍스트 |

## 3. 타이포그래피

| 속성 | 값 |
|------|-----|
| 기본 폰트 | `Pretendard Variable` (CDN, 동적 서브셋) |
| 모노 폰트 | `JetBrains Mono`, `Fira Code`, `Consolas` |
| 행간 (tight) | 1.35 |
| 행간 (normal) | 1.5 |
| 행간 (relaxed) | 1.65 |

## 4. Spacing

| 토큰 | 값 |
|------|-----|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| `--spacing-xl` | 32px |
| `--spacing-2xl` | 48px |
| `--spacing-3xl` | 64px |

## 5. Border Radius

| 토큰 | 값 |
|------|-----|
| `--radius-sm` | 6px |
| `--radius-md` | 10px |
| `--radius-lg` | 16px |
| `--radius-xl` | 24px |
| `--radius-round` | 50px |

## 6. Shadows (Cool-tinted)

| 토큰 | 값 |
|------|-----|
| `--shadow-xs` | `0 1px 2px rgba(15,43,91,0.05)` |
| `--shadow-sm` | `0 1px 3px rgba(15,43,91,0.08), 0 1px 2px rgba(15,43,91,0.04)` |
| `--shadow-md` | `0 4px 12px rgba(15,43,91,0.08), 0 2px 4px rgba(15,43,91,0.04)` |
| `--shadow-lg` | `0 12px 32px rgba(15,43,91,0.10), 0 4px 8px rgba(15,43,91,0.04)` |
| `--shadow-xl` | `0 20px 48px rgba(15,43,91,0.12)` |
| `--shadow-violet` | `0 4px 14px rgba(15,43,91,0.15)` |

> Dark 테마에서는 `rgba(0,0,0,...)` 기반으로 자동 교체

## 7. Transitions

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--transition-fast` | `150ms ease` | 호버, 토글 |
| `--transition-normal` | `250ms ease` | 일반 전환 |
| `--transition-smooth` | `300ms cubic-bezier(0.4,0,0.2,1)` | 부드러운 애니메이션 |

## 8. 브레이크포인트

| 기준 | 값 | 그리드 |
|------|-----|--------|
| Desktop | > 1024px | 3~4열 |
| Tablet | 769~1024px | 2열 |
| Mobile | ≤ 768px | 1열 |

## 9. 쌍대비교 셀 크기

| 토큰 | 값 |
|------|-----|
| `--cell-size-desktop` | 38px |
| `--cell-size-mobile` | 24px |
| `--label-width-desktop` | 200px |
| `--label-width-mobile` | 110px |

## 10. 컴포넌트 현황 (구현 완료)

| 분류 | 컴포넌트 수 | CSS 모듈 수 | 주요 컴포넌트 |
|------|:-----------:|:-----------:|---------------|
| common | 12 | 8 | Modal, Button, Toast, ProgressBar, ErrorBoundary |
| layout | 8 | 8 | PublicNav, Navbar, ProjectSidebar, ProjectLayout |
| model | 9 | 8 | HierarchyCanvas, CriteriaTree, AlternativeTree |
| evaluation | 11 | 7 | PairwiseGrid, PairwiseCell, ConsistencyDisplay |
| results | 8 | 1 (공유) | ComprehensiveChart, ResultSummary, ExportButtons |
| admin | 11 | 9 | ProjectCard, ProjectForm, StateTransitionButton |
| ai | 8 | 3 | AiChatLayout, AiChatbotTool, AiApiKeyModal |
| brainstorming | 3 | 3 | BrainstormingBoard, KeywordZone |
| sensitivity | 2 | 1 | SensitivityChart, WeightSlider |
| statistics | 2 | 2 | VariableSelector, ResultRenderers |
| **합계** | **74** | **50** | |

## 11. CSS 통계

| 지표 | 값 |
|------|-----|
| 총 CSS 모듈 파일 | 78개 |
| 디자인 토큰 참조 | 2,072개 `var(--...)` |
| `!important` 사용 | 6건 (78파일 중) |
| 반응형 `@media` 포함 파일 | 31개 (40%) |
| 클래스 네이밍 | 100% camelCase |
