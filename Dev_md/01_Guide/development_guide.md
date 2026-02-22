# AHP Basic - 개발 가이드

> 최종 수정: 2026-02-22

## 1. 프로젝트 개요
- **프로젝트명**: AHP Basic
- **목표**: I Make It (imakeit.kr) AHP 서비스를 React 18 + Vite + Supabase로 완전 재구현
- **GitHub**: https://github.com/aebonlee/ahp-basic
- **배포**: https://ahp-basic.dreamitbiz.com (GitHub Pages + 커스텀 도메인)
- **참고 리포**: https://github.com/aebonlee/www (www.dreamitbiz.com)
- **Supabase**: https://supabase.com/dashboard/project/hcmgdztsgjvzcyxyayaj

## 2. 기술 스택
| 구분 | 기술 | 버전 | 비고 |
|------|------|------|------|
| Frontend | React | 18.x | SPA 프레임워크 |
| Build Tool | Vite | 5.x | 빠른 개발 서버 |
| Database | Supabase | latest | PostgreSQL + Auth + RLS |
| Auth | Supabase Auth | - | 이메일 + Google + Kakao OAuth (PKCE) |
| Styling | CSS Modules | - | Noto Sans KR 기반 |
| State | Context API | - | Auth, Project, Evaluation 컨텍스트 |
| Routing | React Router DOM | 6.x | HashRouter (GitHub Pages 호환) |
| Chart | recharts | 2.x | 바 차트, 라인 차트 |
| Excel | xlsx + file-saver | - | 결과 내보내기 |
| Hosting | GitHub Pages | - | GitHub Actions 자동 배포 |

## 3. 개발 환경 설정
```bash
# 프로젝트 클론
git clone https://github.com/aebonlee/ahp-basic.git
cd ahp-basic

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 입력

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 테스트 실행
npx vitest run
```

## 4. 폴더 구조
```
ahp-basic/
├── .github/workflows/deploy.yml  # GitHub Actions 배포
├── copy_code/                     # imakeit.kr 원본 HTML + 분석 메모
├── Dev_md/                        # 개발 문서
│   ├── 01_Guide/                  # 개발 가이드
│   ├── 02_Design/                 # 디자인 시스템
│   ├── 03_DevLog/                 # 개발 일지 (날짜별)
│   ├── 04_Inspection/             # 검수 체크리스트
│   ├── 05_Evaluation/             # 평가 템플릿
│   └── 06_Reference/              # 참고 자료 (www 분석, PDF 분석)
├── public/
│   └── CNAME                      # 커스텀 도메인 (ahp-basic.dreamitbiz.com)
├── supabase/
│   └── migrations/
│       └── 001_user_profiles.sql  # 전체 DB 스키마 + RLS
├── src/
│   ├── components/
│   │   ├── admin/          # 관리자 컴포넌트 (8개)
│   │   ├── brainstorming/  # 브레인스토밍 (3개)
│   │   ├── common/         # 공통 컴포넌트 (6개)
│   │   ├── evaluation/     # 평가 컴포넌트 (10개)
│   │   ├── layout/         # Navbar, Footer, PageLayout
│   │   ├── model/          # 모델 빌더 (7개)
│   │   ├── results/        # 결과 표시 (8개)
│   │   └── sensitivity/    # 민감도 (2개)
│   ├── contexts/           # AuthContext, ProjectContext, EvaluationContext
│   ├── hooks/              # useAuth, useProjects, useCriteria 등 (7개)
│   ├── lib/                # ahpEngine, ahpBestFit, constants 등 (8개)
│   ├── pages/              # 페이지 컴포넌트 (18개)
│   ├── styles/             # CSS 모듈
│   └── utils/              # auth, portone, formatters, validators
├── index.html
├── vite.config.js
└── package.json
```

## 5. 개발 프로세스
1. imakeit.kr 웹 소스 수집 → `copy_code/`에 저장
2. 소스 분석 → `source_analysis.md` 작성
3. 전체 개발 계획 수립 (11 Phase, 130 tasks)
4. Phase별 구현 + 단위 테스트 (15/15 통과)
5. GitHub Pages 배포 + 커스텀 도메인
6. 배포 후 인증/리다이렉트/버그 수정
7. 모든 과정을 `Dev_md/`에 기록

## 6. 배포
- **자동 배포**: main 브랜치 push → GitHub Actions → gh-pages 브랜치
- **도메인**: ahp-basic.dreamitbiz.com (DNS CNAME 설정 필요)
- **Supabase 설정 필요**:
  1. DB 마이그레이션 SQL 실행 (`supabase/migrations/001_user_profiles.sql`)
  2. Redirect URLs: `https://ahp-basic.dreamitbiz.com`, `https://ahp-basic.dreamitbiz.com/**`
  3. Google OAuth provider 활성화
  4. Kakao OAuth provider 활성화
  5. PortOne Store ID / Channel Key (결제 기능)
