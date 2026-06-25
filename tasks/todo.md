# Fix CI lint failures (commit a1499e0)

## Root cause
- 413/420 frontend errors come from linting Capacitor iOS build artifacts (`frontend/ios/...`).
- ESLint config only ignored `dist`, not `ios/`.

## Tasks
- [ ] frontend/eslint.config.js: ignore `ios`/`android`; add Node globals for config files
- [ ] frontend/src/components/Sidebar.jsx: remove unused `index` arg
- [ ] backend/src/data/zfe.js: remove dead `getMostRestrictiveThreshold`
- [ ] backend/src/services/critair.service.js: export `CRITAIR_COLORS` + `CRITAIR_LABELS`
- [ ] Run `npm run lint` in frontend + backend → green
- [ ] Run `npm run build` in frontend → green

## Review (done 2026-06-25)
All targets green locally:
- frontend lint (`--max-warnings 20`): exit 0 (was 413 errors → 0 errors, 7 warnings)
- backend lint: exit 0 (was 3 errors → 0)
- frontend build: exit 0

### Changes
- `frontend/eslint.config.js`: ignore `ios`/`android`; Node globals block for `*.config.js`
- `frontend/src/components/Sidebar.jsx`: dropped unused `index` map arg
- `backend/src/data/zfe.js`: removed dead `getMostRestrictiveThreshold`
- `backend/src/services/critair.service.js`: exported `CRITAIR_COLORS` + `CRITAIR_LABELS`

### Note
CI triggers on push/PR to `main`. Current work is on `dev` — needs to reach `main` to turn CI green and unblock the Fly.io deploy.
