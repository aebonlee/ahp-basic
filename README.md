# AHP Basic

**AHP(Analytic Hierarchy Process) 다기준 의사결정 분석 웹 플랫폼**

기준 설정, 쌍대비교, 결과 분석, 통계 검정을 하나의 플랫폼에서 수행합니다.

> 배포: https://ahp-basic.dreamitbiz.com

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 계층 모델 구축 | 기준·대안을 트리 구조로 구성 (드래그 앤 드롭) |
| 브레인스토밍 | 키워드 수집 → 분류 → 모델 반영 |
| 쌍대비교 평가 | 17점 척도 그리드, 실시간 CR 검증 |
| 직접입력 평가 | 점수 부여 방식 간편 평가 |
| 다수 평가자 | 초대 링크, 비회원 참여, 가중 기하평균 집계 |
| 결과 분석 | 종합순위, 민감도 분석, 자원 배분 시뮬레이션 |
| 통계 분석 (10종) | T검정, ANOVA, 카이제곱, 상관, 회귀, 크론바흐 알파 등 |
| AI 분석 도구 | AHP 챗봇, 논문 초안, 참고문헌, 연구 평가 |
| 설문 빌더 | 리커트, 주관식, QR 배포, 결과 통계 |
| 내보내기 | Excel, PDF 내보내기 |

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React 18, Vite 5, CSS Modules |
| Routing | react-router-dom (HashRouter) |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Auth | Email, Google, Kakao (PKCE) |
| Charts | Recharts |
| Test | Vitest, @testing-library/react |
| Deploy | GitHub Actions → GitHub Pages |
| Font | Pretendard Variable |

## 시작하기

```bash
# 1. 클론
git clone https://github.com/aebonlee/ahp-basic.git
cd ahp-basic

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에 Supabase anon key 입력

# 3. 의존성 설치 & 실행
npm install
npm run dev
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 미리보기 |
| `npm run test` | 테스트 실행 |
| `npm run test:watch` | 테스트 워치 모드 |

## 프로젝트 구조

```
src/
├── pages/          30개 라우트 페이지
├── components/     70+ UI 컴포넌트 (10개 도메인)
│   ├── admin/      프로젝트 관리
│   ├── ai/         AI 분석 도구
│   ├── common/     공통 UI (Modal, Button, Toast 등)
│   ├── evaluation/ 쌍대비교 평가
│   ├── layout/     레이아웃 (Navbar, Sidebar 등)
│   ├── model/      모델 빌더 (HierarchyCanvas)
│   ├── results/    결과 시각화
│   └── ...
├── contexts/       전역 상태 (Auth, Project, Evaluation, Toast)
├── hooks/          13개 커스텀 훅
├── lib/            AHP 엔진, 통계, AI, 내보내기
├── utils/          인증, 포맷터, 유효성 검증
└── styles/         디자인 토큰 (CSS Variables)
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드·테스트·배포합니다.

```
main push → npm ci → vitest → vite build → GitHub Pages
```

## 라이선스

MIT
