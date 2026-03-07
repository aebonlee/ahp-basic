# Claude 설정 백업 — 2026-03-07

## .claude/settings.local.json
```json
{
  "permissions": {
    "allow": [
      "Bash(echo:*)",
      "WebFetch(domain:www.dreamitbiz.com)",
      "WebFetch(domain:hcmgdztsgjvzcyxyayaj.supabase.co)",
      "Bash(npm run build:*)",
      "WebSearch",
      "WebFetch(domain:imakeit.kr)",
      "Bash(npx vite build)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(npx gh-pages:*)",
      "Bash(git push:*)",
      "Bash(git pull:*)",
      "Bash(git stash:*)",
      "Bash(git stash pop:*)",
      "Bash(gh run list:*)",
      "Bash(npm run test:*)"
    ]
  }
}
```

## MEMORY.md (Auto Memory)
```markdown
# AHP Basic Project Memory

## User Preferences
- NEVER call or fetch any Netlify authorize URLs — Netlify is not used in this project

## Supabase JS Client Gotchas
- `supabase.rpc()` returns `PostgrestFilterBuilder` (a thenable, NOT a real Promise)
- `.catch()` does NOT exist on PostgrestFilterBuilder — use `.then(null, () => {})` instead
- Same applies to other Supabase query builders (`.from().select()`, etc.)
- `onAuthStateChange` callback should NOT contain RPC calls — causes OAuth flow interference (especially Kakao). Move to separate `useEffect`.

## Project Stack
- React 18 + Vite 5 SPA with HashRouter
- Supabase Auth (Email, Google, Kakao) with PKCE flow
- GitHub Pages deployment via `gh-pages -d dist`
- Supabase project ref: `hcmgdztsgjvzcyxyayaj`

## Deploy Workflow
- **GitHub Actions 자동 배포** (main push 시 자동 실행)
- Workflow: `.github/workflows/deploy.yml`
- 빌드 시 Secrets 사용: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- CNAME: `ahp-basic.dreamitbiz.com` in `public/CNAME`
- `gh-pages` npm 패키지 제거됨 — 수동 배포 사용 안 함

## Key Files
- Auth: `src/contexts/AuthContext.jsx`, `src/utils/auth.js`
- Routes: `src/App.jsx` (HashRouter)
- Nav: `src/components/layout/PublicNav.jsx`
- Supabase: `src/lib/supabaseClient.js`, `.env`
```
