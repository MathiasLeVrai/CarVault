#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/carvault_e2e}"
export JWT_SECRET="${JWT_SECRET:-e2e-local-secret}"
export NODE_ENV="${NODE_ENV:-test}"
export PORT="${PORT:-3001}"

npx prisma migrate deploy
exec node src/index.js
