# 하위 페이지 Hero 타이틀 영역 디자인 개선

## 날짜
2026-03-09

## 개요
모든 하위 페이지(8개)의 Hero 타이틀 영역을 밋밋한 단색 배경에서 **페이지별 고유 컬러 그라데이션 + 도트 패턴 장식**으로 전면 개편했다.

## 변경 전 (공통)
- 배경: `#f8fafc` (거의 흰색)
- 타이틀: `#0f172a` (진한 검정)
- 설명: `#64748b` (회색)
- 태그: 흰 배경 + 회색 테두리
- 장식 요소: 없음

## 변경 후 (공통 패턴)
- 배경: 페이지별 135도 3색 그라데이션
- 타이틀: `#fff` (흰색)
- 설명: `rgba(255,255,255,0.8)` (반투명 흰색)
- 태그: 글래스모픽 (반투명 배경 + `backdrop-filter: blur(8px)`)
- 장식 요소:
  - `::before` — 도트 패턴 (24px 간격 radial-gradient)
  - `::after` — 우상단 큰 반투명 원형 블롭 (400px)

## 페이지별 컬러 테마

| 페이지 | 메뉴명 | 그라데이션 컬러 | 테마 |
|---|---|---|---|
| AboutPage | AHP 소개 | `#2563eb → #1e40af → #1e3a8a` | Blue (브랜드) |
| FeaturesPage | 주요 기능 | `#6366f1 → #4338ca → #312e81` | Indigo |
| GuidePage | 이용 가이드 | `#14b8a6 → #0d9488 → #115e59` | Teal |
| LearnPage | 학습 가이드 | `#8b5cf6 → #6d28d9 → #4c1d95` | Violet |
| ManualPage | 사용설명서 | `#64748b → #475569 → #1e293b` | Slate |
| PricingPage | 사용요금 | `#2563eb → #1d4ed8 → #1e3a8a` | Blue (브랜드) |
| ManagementPage | 관리 기능 | `#10b981 → #059669 → #064e3b` | Emerald |
| SurveyStatsPage | 설문 및 통계 | `#0ea5e9 → #0284c7 → #0c4a6e` | Sky |

## 변경 파일
- `src/pages/AboutPage.module.css`
- `src/pages/FeaturesPage.module.css`
- `src/pages/GuidePage.module.css`
- `src/pages/LearnPage.module.css`
- `src/pages/ManualPage.module.css`
- `src/pages/PricingPage.module.css`
- `src/pages/ManagementPage.module.css`
- `src/pages/SurveyStatsPage.module.css`

## 반응형
- 768px 이하: `padding: 60px var(--spacing-md) 40px`, `font-size: 1.8rem`
- 기존에 반응형 `.hero` 오버라이드가 없던 5개 페이지에 추가

## 비고
- HomePage Hero는 별도의 풍부한 디자인(floating orbs, AHP 시각화)을 유지
- JSX 변경 없음 — CSS만 수정하여 기존 마크업 구조 유지
