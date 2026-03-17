# CarVault — Product & Technical Brief

**Production:** https://carvault.fly.dev

## 1. What It Is

CarVault is a mobile-first PWA: the digital vault and operating system for car ownership. It centralizes documents (insurance, registration, CT, invoices), expense and maintenance tracking, mileage/fuel history, expiration reminders, and resale-ready PDF export. Goal: replace chaos with clarity, control, and automation. It should feel like *“The Notion / Apple Wallet of your car.”*

## 2. Problem & Users

**France:** 40M+ vehicles. Most owners lose documents, forget expiration dates (CT fine = 135€), under-track maintenance, don’t know real cost of ownership, and struggle at resale. Today everything is scattered (paper, emails, photos, garage invoices, insurance portals). Competing apps focus on fuel; none combine document vault + smart reminders + health score + resale export.

**Target users:** Phase 1 — Individuals (France, 25–55): single/multi-car owners, resale planners; pain = “I forgot my inspection and got fined”; motivation = peace of mind + control. Phase 2 — Small fleets (artisans, 5–20 vehicles). Phase 3 — B2B (garages, dealerships, insurance).

**Emotional hook:** Confidence and control over a major asset; trust at resale; financial transparency; security of important documents.

## 3. Current Features (v2)

- **Core:** JWT auth · Vehicle CRUD (manual + license plate via RapidAPI) · Document upload + expiration tracking · Custom reminders (J-30, J-14, J-7, J-1) · Expense tracking by category · Smart alerts (cron 6h) · Vehicle Health Score (/100, A–D) · Resale PDF export · Public share links (token, 30d) · Action dashboard (3 cards max) · Onboarding (4 steps) · Mileage + fuel tracking + stats · Badges/gamification · Notification prefs (email/push/weekly) · Per-document reminder config · Document type auto-detect · Map (garage/station) · Stripe subscriptions · PWA + service worker

- **Disabled (code present):** Bank/Nordigen (`backend/src/controllers/bank.controller.js`, `frontend/src/pages/BankPage.jsx`)

## 4. Technical Stack

**Frontend:** React 19, Vite 7, Tailwind 4, React Router 7, Recharts, Framer Motion.  
**Backend:** Node, Express 4, Prisma 6, PostgreSQL (Neon), JWT + bcryptjs, Multer (memory → Fly.io Volume), PDFKit, node-cron, Nodemailer, Stripe, Docker, Fly.io (CDG, 1GB volume), RapidAPI, CarAPI.

**CI/CD:** GitHub Actions — CI (ESLint, Vite build, Prisma validate, Docker build); CD (auto-deploy to Fly.io on main). Git: single `main` + feature branches/PR.

**Architecture:** Monolithic Express API, 10+ Prisma models, 45+ REST endpoints, ~50 backend / ~35 frontend files; stateless, horizontally scalable. Storage abstracted (local / S3-compatible).

## 5. Business Model & Market

**Freemium:** Free = 1 vehicle, basic docs, simple reminders. Premium (3€/mo target) = unlimited vehicles, health score, unlimited PDF, analytics, smart reminders, multi-vehicle dashboard. Future: B2B fleet SaaS, garage/dealership/insurance partnerships, certified resale reports, aggregated insights.

**Market:** France 40M vehicles; 1% × 3€/mo ≈ 14.4M€ ARR potential. Scale: Neon, Fly.io, abstracted storage; monolith splittable; SPA → React Native possible.

**Risks:** Low engagement, acquisition difficulty, high trust expectations, API dependence, competition from Drive + reminders. Critical: *What makes CarVault 10× better than Drive + calendar?*

## 6. Vision & Priorities

**Long-term:** “OS for vehicle ownership” — certified resale report, predictive maintenance, value tracking, recall alerts, cost dashboard, cross-vehicle comparison, fleet compliance, public API for garages.

**Strategic questions:** What drives weekly engagement? How to become essential? Retention loops? Switching costs? Fastest path to monetization? Network effects? What makes leaving feel unsafe?

**Done:** Stripe, Fly.io Volume storage, CI/CD, ESLint clean, fuel + stats, badges, configurable reminders, share links + public PDF, notification center, onboarding, document auto-detect.

**Next:** OCR scanning, PWA push notifications, BullMQ job queue, Sentry/monitoring, automated tests, i18n (EN/DE), bank integration (code ready, disabled).

## 7. Founder Intent & Positioning

**Goal:** Turn CarVault into a serious SaaS. Need: architectural review, scalability, 12‑month roadmap, retention, breakout features — think like a startup founder.

**Positioning:** Not “document storage for cars” but a *control layer over vehicle ownership*. Executed well → high-retention, emotionally anchored, financially justified SaaS.