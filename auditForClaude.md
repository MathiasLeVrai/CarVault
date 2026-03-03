CarVault — Full Product & Technical Brief (v2 + Vision)
1️⃣ One-Liner

CarVault is a mobile-first PWA that centralizes everything related to vehicle ownership: documents, expenses, maintenance tracking, reminders, and resale reports.

It is a digital vault and operating system for car ownership.

Production: https://carvault.fly.dev

2️⃣ Core Concept

CarVault is a digital vault for vehicle ownership.

It centralizes:

Insurance documents

Registration documents

Technical inspection (Contrôle technique)

Invoices & warranties

Maintenance tracking

Expense tracking

Mileage history

Expiration reminders

Vehicle resale history

The goal is to remove chaos from car ownership and replace it with clarity, control, and automation.

CarVault should feel like:

“The Notion / Apple Wallet of your car.”

3️⃣ Problem Being Solved

In France, there are 40M+ vehicles in circulation.

Most car owners:

Lose documents

Forget expiration dates (CT fine = 135€)

Don’t properly track maintenance

Don’t know real cost of ownership

Struggle when reselling their vehicle

Car ownership today is fragmented across:

Paper folders

Emails

Random photos

Garage invoices

Insurance portals

Existing apps (Drivvo, Fuelio, aCar) focus mainly on fuel tracking.

None combine:

Document vault

Smart reminders

Health score

Resale-ready export

4️⃣ Target Users
Phase 1 — Individuals (France, 25–55)

Single car owners

Young professionals

Multi-car families

People planning resale

Pain point:
“I forgot my inspection and got fined.”

Motivation:
Peace of mind + control.

Phase 2 — Small Fleets

Artisans

Small businesses (5–20 vehicles)

Need compliance + cost reporting

Phase 3 — B2B Expansion

Garages

Dealerships

Insurance partnerships

5️⃣ Emotional Hook

CarVault touches emotional triggers:

Peace of mind

Control over a major asset

Trust during resale

Financial transparency

Security of important documents

A car is often the second biggest purchase after a house.

The emotional hook is:

Confidence and control over something expensive and important.

6️⃣ Current State — Features Delivered (v2)
Core System

JWT authentication

Vehicle CRUD (manual + license plate via RapidAPI)

Document upload with expiration tracking

Custom reminders (J-30, J-14, J-7, J-1)

Expense tracking by category

Smart alert system (cron every 6h)

Vehicle Health Score (/100, A–D grade)

Export resale PDF (complete report)

Public read-only share links (token, 30 days expiration)

Action-oriented dashboard

Guided onboarding (4 steps)

Mileage history tracking

Notification preferences center

PWA installable with service worker

7️⃣ Technical Stack

Frontend:

React 19

Vite 7

Tailwind CSS 4

React Router 7

Recharts

Framer Motion

Backend:

Node.js

Express 4

Prisma 6

PostgreSQL (Neon serverless)

Other:

JWT + bcryptjs

Multer (local storage)

PDFKit

node-cron

Nodemailer

Docker multi-stage

Fly.io (CDG region)

RapidAPI (license plate)

CarAPI (vehicle specs)

Architecture:

Monolithic Express API

7 Prisma models

35+ REST endpoints

40 backend files

31 frontend files

Stateless API, horizontally scalable.

8️⃣ Business Model

Freemium:

Free:

1 vehicle

Basic documents

Simple reminders

Premium (3€/month target):

Unlimited vehicles

Health score

Unlimited PDF export

Advanced analytics

Smart reminders

Multi-vehicle dashboard

Future revenue:

B2B fleet SaaS

Garage marketplace commissions

Insurance partnerships

Embedded insurance comparison

Certified resale reports

Anonymous aggregated maintenance insights

9️⃣ Market & Scalability

France TAM:
40M vehicles

If:
1% penetration × 3€/month
= 14.4M€ ARR

Technical scalability:

Neon (serverless PostgreSQL)

Fly.io autoscaling

Easy migration to S3/R2

Monolith easily splittable into microservices

React SPA → React Native possible

🔟 Risks

Low engagement (users log in twice a year)

Hard user acquisition

Trust & security expectations are high

Dependence on external APIs

Competition from generic tools (Drive + reminders)

Critical risk:
What makes CarVault 10x better than Google Drive + calendar reminders?

1️⃣1️⃣ Strategic Vision (Long-Term)

CarVault becomes:

The operating system for vehicle ownership.

Long-term features:

Certified resale report

Predictive maintenance

Vehicle value tracking

Recall alerts

Cost of ownership dashboard

Cross-vehicle comparison

Fleet compliance automation

Public API for garages

1️⃣2️⃣ Strategic Questions

To reach product-market fit:

What feature creates weekly engagement?

How to make CarVault essential?

What creates strong retention loops?

How to create switching costs?

What is the fastest path to monetization?

What feature creates network effects?

What would make users feel unsafe leaving CarVault?

1️⃣3️⃣ Immediate Priorities

OCR intelligent document scanning

Push notifications (true PWA push)

Stripe payments

Cloud file storage (S3/R2)

Job queue (BullMQ)

Monitoring + Sentry

Automated tests

Multi-language (EN / DE)

🎯 Founder Intent

Goal:

Turn CarVault into a serious SaaS product.

Need help to:

Identify architectural weaknesses

Improve scalability

Design 12-month roadmap

Increase retention

Define breakout features

Think like a startup founder

🔥 Final Positioning

CarVault is not just:

“Document storage for cars.”

It is:

A control layer over vehicle ownership.

If executed correctly, it becomes:

High-retention, emotionally anchored, financially justified SaaS.