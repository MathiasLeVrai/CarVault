# Fix: missing `@aws-sdk/s3-request-presigner` in prod

## Plan
- [x] Add `@aws-sdk/s3-request-presigner` to `backend/package.json` (used by `storage.service.js`)
- [x] Remove misplaced dep from root `package.json` (Capacitor-only workspace)
- [x] `npm install` in backend to update lockfile
- [x] Verify require resolves

## Review
Cause: `storage.service.js` require `@aws-sdk/s3-request-presigner`, but the dep lived only in the root `package.json`. Prod image (`/app/backend`) only installs backend deps → MODULE_NOT_FOUND at boot (auth → storage chain). Fix: move dep into `backend/package.json` and remove from root. Verified with `require('./backend/src/services/storage.service.js')`.
