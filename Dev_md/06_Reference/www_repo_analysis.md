# 참고 자료 - www 리포지토리 분석

## 리포 정보
- **URL**: https://github.com/aebonlee/www
- **사이트**: www.dreamitbiz.com
- **용도**: 디자인 시스템, 컴포넌트 구조, 로그인 UI 참고

## 기술 스택
| 항목 | 기술 |
|------|------|
| UI | React 18 |
| Build | Vite 5.x |
| Routing | React Router DOM 6.x |
| State | Context API |
| Font | Noto Sans KR |
| Deploy | GitHub Pages |

## 프로젝트 구조
```
www/
├── webapp/              # 프로덕션 빌드
├── webapp-react/        # 개발 소스
│   └── src/
│       ├── components/
│       │   └── layout/  # Navbar, Footer
│       ├── pages/       # Home, Services, Portfolio, About, Blog, Contact
│       ├── contexts/    # ThemeContext, LanguageContext
│       ├── utils/       # translations.js
│       └── index.css    # 글로벌 스타일
├── backup/              # 레거시 HTML 버전
├── docs/                # 문서
└── Dev_md/              # 개발 문서
```

## AHP 프로젝트에 재사용할 항목
1. **Navbar 컴포넌트**: 구조 및 스타일 복제
2. **Footer 컴포넌트**: 구조 및 스타일 복제
3. **ThemeContext**: Dark/Light 모드 토글
4. **LanguageContext**: 한국어/영어 전환
5. **디자인 시스템**: 컬러, 타이포그래피, 레이아웃
6. **반응형 디자인**: 미디어 쿼리, 모바일 메뉴

## AHP에서 추가 구현 완료 항목
1. **Supabase Auth**: 이메일/비밀번호 + Google + Kakao OAuth (PKCE flow)
2. **AuthContext**: 인증 상태 + profile + isAdmin 관리
3. **Protected Routes**: ProtectedRoute + AdminGuard 컴포넌트
4. **AHP 전용 페이지/컴포넌트**: 18 페이지, 47 컴포넌트
5. **Supabase DB**: 9개 테이블 + RLS 정책 + 트리거
6. **PortOne V2 SDK**: 결제 유틸 (portone.js)
7. **관리자 이메일 목록**: aebon@kakao.com, aebon@kyonggi.ac.kr, ryuwebpd@gmail.com

## 배포
- GitHub: https://github.com/aebonlee/ahp-basic
- 도메인: https://ahp-basic.dreamitbiz.com
