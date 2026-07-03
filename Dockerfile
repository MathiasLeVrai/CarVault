# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Production backend ----
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Generate Prisma client
COPY backend/prisma ./backend/prisma
RUN cd backend && npx prisma generate

# Copy backend source
COPY backend/src ./backend/src

# Prisma CLI (devDependency) requis pour migrate deploy au démarrage (Docker Compose / Fly release_command)
RUN cd backend && npm install prisma@6 --no-save

# Entrypoint Docker Compose (migrations + démarrage)
COPY docker/entrypoint.sh ./backend/docker/entrypoint.sh
RUN chmod +x /app/backend/docker/entrypoint.sh

# Copy frontend build from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create uploads directory
RUN mkdir -p /app/backend/uploads

WORKDIR /app/backend

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "src/index.js"]
