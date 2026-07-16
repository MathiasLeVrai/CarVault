# Vague 2 — fondations

## Tasks
- [x] Zod : middleware `validate` + schémas auth / vehicle / document / share
- [x] Refresh tokens stockés en SHA-256 (compat legacy plaintext au refresh)
- [x] Crons : entrée `worker.js` + garde `RUN_CRONS` + lock table `cron_locks`
- [x] TanStack Query : provider + Dashboard / Vehicles / Documents / Expenses / VehicleDetail
- [x] Vérifier lint/smoke + Review

## Review
- **Zod** : `validate.middleware` + `validation/schemas.js` branchés sur auth, vehicles (create/update/id), documents (create/delete), share (create/links/revoke). Controllers auth allégés.
- **Refresh tokens** : `generateRefreshToken` persiste `sha256(token)` ; `refresh()` lookup hash puis fallback plaintext legacy (une rotation migre). Pas de migration Prisma.
- **Crons** : `src/worker.js` + `npm run worker` ; API skip crons en `production` sauf `RUN_CRONS=1` ; local non-prod garde les crons. Mutex `cron_locks` (CREATE IF NOT EXISTS) pool-safe.
- **TanStack Query** : `QueryClientProvider` + `lib/query.js` ; pages Dashboard/Vehicles/Documents/Expenses/VehicleDetail + MaintenancePlanCard invalidation.
- Lint backend OK ; frontend pages OK (1 warning hooks préexistant Documents). Smoke Zod OK.
