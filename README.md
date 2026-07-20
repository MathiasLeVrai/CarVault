# Carvio — Gestion intelligente de véhicules

**Carvio** est une application **PWA mobile-first** (et app native iOS via Capacitor) qui permet aux particuliers de centraliser documents, dépenses, entretien et rappels liés à leurs véhicules. Installable sur l'écran d'accueil, utilisable hors ligne grâce au Service Worker.

**Production :** [carvio.fr](https://carvio.fr)

---

## Sommaire

- [Parcours d'activation](#parcours-dactivation)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Démarrage local](#démarrage-local)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données (Prisma)](#base-de-données-prisma)
- [API REST](#api-rest)
- [Tâches planifiées (cron)](#tâches-planifiées-cron)
- [Abonnement Premium](#abonnement-premium)
- [Apps mobiles (Capacitor)](#apps-mobiles-capacitor)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [CI/CD](#cicd)
- [Scripts utiles](#scripts-utiles)

---

## Parcours d'activation

```
1. Créer un compte
2. Ajouter un véhicule (manuellement ou via recherche par plaque)
3. Uploader 1 document avec une date d'expiration (assurance, CT…)
4. Recevoir automatiquement un rappel avant expiration
```

Objectif produit : atteindre **1 véhicule + 1 document + 1 rappel planifié** en moins de 5 minutes.

---

## Fonctionnalités

### Coffre-fort de documents
- Upload de tous les documents liés au véhicule : assurance, carte grise, contrôle technique, factures, garanties, constats d'accident…
- Dates d'expiration et rappels configurables par document (J-30, J-14, J-7, J-1, J+0)
- Stockage local en dev, **Cloudflare R2** en production

### Alertes intelligentes
- Génération automatique d'alertes : expiration de documents, entretien à prévoir, CT, vidange, pneus saisonniers, restrictions ZFE, budget carburant dépassé, pic de dépenses…
- Centre de notifications in-app avec snooze
- Notifications **email** (digest hebdomadaire, rappels), **Web Push** (PWA) et **push natif iOS** (APNs)
- Préférences utilisateur : email, push, digest hebdomadaire

### Suivi dépenses & entretien
- Catégories détaillées : entretien, vidange, freins, pneus, carrosserie, pare-brise, CT, parking, péage, nettoyage, amendes…
- Historique de kilométrage
- Suivi carburant (pleins, consommation, coût au km)
- Statistiques mensuelles et annuelles, coût de possession
- Plan d'entretien personnalisable par véhicule (intervalles km/temps)

### Score santé & valorisation
- Score santé /100 avec note A–D (documents + entretien)
- Estimation de valeur (saisie manuelle ou cote La Centrale)
- Vignette Crit'Air, données techniques enrichies via CarAPI

### Dossier revente & partage
- Export PDF complet du dossier véhicule
- Lien public sécurisé (token, expiration, mot de passe optionnel, masquage du prix d'achat)

### Dashboard d'action
- Vue synthétique : prochaines échéances, alertes non lues, dépenses récentes, actions à mener
- Badges de gamification (premier véhicule, premier document, pleins réguliers…)

### Autres
- Recherche véhicule par **plaque d'immatriculation** (API RapidAPI)
- Catalogue marques/modèles via **CarAPI**
- Carte des services auto à proximité (garages, CT, stations…)
- Onboarding guidé
- Authentification JWT + refresh tokens, mot de passe oublié par email
- Abonnement Premium (Stripe web + RevenueCat iOS)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Client                                                     │
│  React 19 PWA  ·  Capacitor (iOS)                           │
│  Service Worker (cache offline)  ·  Web Push  ·  APNs        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS  /api  (/api/media signé)
┌──────────────────────────▼──────────────────────────────────┐
│  Backend Express (Node.js)                                  │
│  Controllers → Services → Prisma → PostgreSQL (NeonDB)      │
│  Cron jobs (alertes, digest, budget)  ·  Swagger OpenAPI   │
└──────┬──────────────┬──────────────┬─────────────────────────┘
       │              │              │
  Cloudflare R2   Stripe /       RapidAPI / CarAPI
  (fichiers)      RevenueCat     (plaque, marques)
                  (abonnements)
```

En production, une **image Docker unique** sert le build frontend (`frontend/dist`) et l'API backend sur le même port (8080).

---

## Stack technique

| Couche | Technologies |
|--------|--------------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, React Router 7, Recharts, Framer Motion, Leaflet |
| **Backend** | Node.js 20, Express 4, Prisma 6, PostgreSQL |
| **Auth** | JWT + refresh tokens, bcryptjs |
| **Upload** | Multer → disque local (dev) / Cloudflare R2 (prod) |
| **PDF** | PDFKit |
| **Email** | Nodemailer (SMTP) |
| **Paiements** | Stripe (web), RevenueCat (iOS In-App Purchase) |
| **Push** | web-push (VAPID) |
| **Monitoring** | Sentry (frontend + backend) |
| **Alertes** | node-cron (jobs récurrents) |
| **Mobile** | Capacitor 8 (`fr.carvio.app`) |
| **Déploiement** | Docker multi-stage, Fly.io (région CDG), GitHub Actions |
| **APIs tierces** | RapidAPI (plaque FR), CarAPI (marques/modèles), prix carburant |

---

## Structure du projet

```
CarVault/
├── Dockerfile                    # Build multi-stage (frontend → backend → image unique)
├── fly.toml                      # Config Fly.io (app: carvault, région: cdg)
├── capacitor.config.json         # Config Capacitor (appId: fr.carvio.app)
├── package.json                  # Scripts racine (dev, cap, e2e)
├── playwright.config.js          # Config tests E2E
├── e2e/                          # Tests Playwright (8 parcours)
├── .github/workflows/deploy.yml  # CI/CD (lint → E2E → deploy Fly.io)
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Modèles (Utilisateur, Vehicule, Document, Depense…)
│   │   └── migrations/           # Migrations SQL versionnées
│   ├── src/
│   │   ├── index.js              # Point d'entrée Express
│   │   ├── controllers/          # Handlers HTTP
│   │   ├── services/             # Logique métier (auth, pdf, health, plate, stripe…)
│   │   ├── routes/               # Routes Express
│   │   ├── middleware/           # Auth JWT, erreurs, upload Multer
│   │   ├── cron/                 # Jobs planifiés (alertes, digest, budget…)
│   │   ├── docs/openapi.yaml     # Spécification OpenAPI 3
│   │   └── uploads/              # Fichiers locaux (dev) — volume Fly.io en prod
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/                # Dashboard, Vehicles, Documents, Expenses, Alerts…
│   │   ├── components/           # UI, véhicule, onboarding…
│   │   ├── context/              # AuthContext, ThemeContext
│   │   ├── hooks/                # usePush, useBodyScrollLock…
│   │   ├── services/api.js       # Client API centralisé
│   │   └── utils/                # Helpers, labels, formateurs
│   ├── public/
│   │   ├── sw.js                 # Service Worker (PWA / cache offline)
│   │   └── manifest.json
│   └── .env.example
│
└── ios/                          # Projet Xcode (Capacitor)
```

---

## Démarrage local

### Prérequis

- **Node.js 20+**
- **PostgreSQL 14+** (local ou URL [NeonDB](https://neon.tech))
- **npm**

### Installation rapide (< 10 min)

```bash
# 1. Installer toutes les dépendances (racine + backend + frontend)
npm run install:all

# 2. Configurer les variables d'environnement
cp backend/.env.example backend/.env
# Renseigner au minimum : DATABASE_URL, JWT_SECRET

# 3. Appliquer les migrations Prisma
cd backend
npx prisma migrate dev
cd ..

# 4. Lancer backend (:3001) + frontend (:5173)
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/api/docs |
| OpenAPI JSON | http://localhost:3001/api/docs.json |
| Prisma Studio | `cd backend && npx prisma studio` |

> Le frontend proxifie automatiquement `/api` (dont `/api/media`) vers le backend via Vite (`frontend/vite.config.js`).

### Base de données E2E (tests locaux)

```bash
createdb carvault_e2e
npm run test:e2e
```

Playwright démarre automatiquement le backend et le frontend avec une base dédiée (jamais la prod).

### Docker Compose (tout-en-un)

Alternative sans installer Node.js ni PostgreSQL localement : une seule commande lance la base, applique les migrations et démarre l'app (frontend + API sur le même port).

```bash
# Optionnel : personnaliser le port ou le JWT
cp .env.docker.example .env.docker

# Construire et démarrer
docker compose up --build

# En arrière-plan
docker compose up --build -d
```

| Service | URL |
|---------|-----|
| Application (frontend + API) | http://localhost:8080 |
| Swagger UI | http://localhost:8080/api/docs |
| Health check | http://localhost:8080/api/health |

```bash
# Arrêter
docker compose down

# Arrêter et supprimer les volumes (BDD + uploads)
docker compose down -v
```

**Ce qui est inclus :** PostgreSQL 16, migrations Prisma automatiques, volume persistant pour les uploads.

**Ce qui n'est pas inclus :** hot-reload (c'est un build production). Pour développer avec rechargement à chaud, utiliser `npm run dev`.

---

## Variables d'environnement

### Backend (`backend/.env`)

Copier depuis `backend/.env.example`. Variables **obligatoires** :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL (`?sslmode=require` pour Neon) |
| `JWT_SECRET` | Secret de signature JWT (fort, unique en prod) |

Variables **recommandées** :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `JWT_EXPIRES_IN` | Durée de vie du JWT | `7d` |
| `PORT` | Port du serveur | `3001` (dev) / `8080` (prod) |
| `APP_URL` | URL publique du site (liens email, reset password) | `http://localhost:5173` |
| `CORS_ORIGIN` | Origines autorisées (séparées par virgule) | `http://localhost:5173` |
| `UPLOAD_DIR` | Dossier uploads local (accès via `/api/media` signé, plus de static public) | `./uploads` |

Variables **optionnelles** (fonctionnalités avancées) :

| Variable | Fonctionnalité |
|----------|----------------|
| `RAPIDAPI_KEY` | Recherche par plaque d'immatriculation |
| `CARAPI_TOKEN` / `CARAPI_SECRET` | Catalogue marques/modèles |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Stockage Cloudflare R2 (prod). Préférer un **bucket privé** : l’API sert des URLs présignées. `R2_PUBLIC_URL` reste utile pour la CSP / legacy. |
| `RUN_CRONS` | `1` pour lancer les crons dans le process API. En prod multi-instance : laisser off et lancer `npm run worker`. En local (non-production) les crons démarrent par défaut. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Emails (reset password, digest) |
| `FEEDBACK_EMAIL` | Réception des idées utilisateur |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Notifications Web Push (PWA) |
| `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, `APNS_PRIVATE_KEY`, `APNS_PRODUCTION` | Push natif iOS (APNs, clé `.p8`) |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_PRICE_ID_YEARLY`, `STRIPE_WEBHOOK_SECRET` | Abonnement Premium (web) |
| `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_ENTITLEMENT_ID`, `REVENUECAT_WEBHOOK_AUTH` | Abonnement iOS |
| `SENTRY_DSN`, `SENTRY_RELEASE` | Monitoring backend |
| `SWAGGER_ENABLED` | Forcer Swagger en prod (`true`/`false`) |

### Frontend (`frontend/.env`)

Copier depuis `frontend/.env.example` :

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL de l'API (`/api` en dev via proxy, URL absolue en prod) |
| `VITE_PUBLIC_APP_URL` | URL publique de l'app |
| `VITE_STORAGE_PUBLIC_URL` | URL publique R2 (si différente de l'API) |
| `VITE_SENTRY_DSN` | Monitoring frontend |
| `VITE_IOS_SUBSCRIPTIONS_ENABLED` | Activer RevenueCat sur iOS |
| `VITE_REVENUECAT_IOS_API_KEY` | Clé publique RevenueCat iOS |

---

## Base de données (Prisma)

### Modèles principaux

| Modèle | Rôle |
|--------|------|
| `Utilisateur` | Compte, préférences notif, statut Premium |
| `Vehicule` | Véhicule (marque, modèle, km, plaque, config entretien…) |
| `Document` | Fichier + type + date d'expiration + rappels |
| `Depense` | Dépense catégorisée liée à un véhicule |
| `EntreeKilometrage` | Historique kilométrique |
| `EntreeCarburant` | Suivi des pleins |
| `Alerte` | Notification in-app (avec snooze) |
| `LienPartage` | Lien public de partage de dossier |
| `AbonnementPush` | Abonnement push (Web Push ou token APNs iOS) |
| `RefreshToken` | Refresh token JWT |
| `PasswordResetToken` | Token de réinitialisation mot de passe |

### Commandes courantes

```bash
cd backend

npx prisma migrate dev          # Créer/appliquer une migration (dev)
npx prisma migrate deploy       # Appliquer les migrations (prod / CI)
npx prisma generate             # Régénérer le client Prisma
npx prisma studio               # Interface graphique BDD
npx prisma validate             # Valider le schéma
```

---

## API REST

**Authentification :** toutes les routes (sauf auth publique, share public, health, webhooks) requièrent :

```
Authorization: Bearer <JWT>
```

**Format :** JSON (sauf upload `multipart/form-data`).

**Erreurs communes :** `400` validation · `401` token invalide · `404` introuvable · `429` rate limit · `500` erreur serveur.

### Documentation interactive

La spec complète est maintenue dans `backend/src/docs/openapi.yaml` et exposée via Swagger :

- **Swagger UI :** http://localhost:3001/api/docs
- **JSON brut :** http://localhost:3001/api/docs.json

Désactiver Swagger : `SWAGGER_ENABLED=false` dans `backend/.env`.

### Routes principales

| Préfixe | Description |
|---------|-------------|
| `GET /api/health` | Santé du serveur |
| `/api/auth/*` | Inscription, login, refresh, profil, reset password, suppression compte |
| `/api/vehicles/*` | CRUD véhicules, PDF dossier revente, score santé |
| `/api/documents/*` | CRUD documents (upload multipart) |
| `/api/expenses/*` | CRUD dépenses + statistiques |
| `/api/alerts/*` | Liste, lecture, snooze des alertes |
| `/api/dashboard/*` | Données agrégées du tableau de bord |
| `/api/brands/*` | Marques/modèles CarAPI + lookup plaque |
| `/api/vehicles/:id/mileage/*` | Historique kilométrage |
| `/api/vehicles/:id/fuel/*` | Suivi carburant |
| `/api/share/*` | Création et consultation de liens de partage |
| `/api/notifications/*` | Préférences de notification |
| `/api/subscription/*` | Statut Premium, checkout Stripe, webhooks |
| `/api/badges/*` | Badges de gamification |
| `/api/push/*` | Push : Web Push (VAPID) + token natif iOS (APNs) |
| `/api/cote/*` | Cote La Centrale |
| `/api/feedback/*` | Envoi d'idées utilisateur |

### Auth — flux refresh token

**Web** — refresh token en cookie `HttpOnly` (`carvault_rt`, `Secure`, `SameSite=Lax`, path `/api/auth`). L’access token JWT (15 min) reste en Bearer / localStorage.

```
POST /api/auth/login     → Set-Cookie + { token, user }     (pas de refreshToken dans le JSON)
POST /api/auth/refresh   → cookie auto + { token }          (credentials: include)
POST /api/auth/logout    → invalide le refresh + clearCookie
```

**iOS Capacitor** — même API, mais le refresh est aussi renvoyé dans le body et stocké en localStorage (cookies cross-origin peu fiables sur `capacitor://`). Header `X-Carvio-Client: ios-native`.

**CSP** — Helmet envoie une Content-Security-Policy stricte (scripts `self` + Plausible ; pas de scripts inline pirates).

---

## Tâches planifiées (cron)

Les jobs tournent dans le processus backend au démarrage (`backend/src/index.js`) :

| Job | Fichier | Fréquence | Rôle |
|-----|---------|-----------|------|
| Alertes intelligentes | `alert.cron.js` | Quotidien | Expiration docs, entretien, CT, vidange, pneus, ZFE… |
| Digest hebdomadaire | `weekly-digest.cron.js` | Lundi 8h | Résumé email/push de la semaine |
| Rapport mensuel | `monthly-report.cron.js` | 1er du mois | Bilan mensuel par email |
| Engagement | `engagement.cron.js` | Périodique | Relances utilisateurs inactifs |
| Budget & stats | `budget.cron.js` | Quotidien 9h | Pic dépenses, coût/km, budget carburant, records km |

---

## Abonnement Premium

| Canal | Mécanisme | Limite gratuite |
|-------|-----------|-----------------|
| **Web** | Stripe Checkout + Customer Portal | 1 véhicule |
| **iOS** | RevenueCat (In-App Purchase) | 1 véhicule |

Les webhooks Stripe et RevenueCat sont enregistrés **avant** `express.json()` pour conserver le corps brut.

---

## Apps mobiles (Capacitor)

L'app native iOS embarque le build Vite de `frontend/dist`.

```bash
# 1. Variables frontend pour un build store/prod
cp frontend/.env.example frontend/.env
# VITE_API_URL="https://carvio.fr/api"
# VITE_PUBLIC_APP_URL="https://carvio.fr"

# 2. Build web + sync projet natif
npm run cap:sync

# 3. Ouvrir le projet natif
npm run cap:open:ios       # Xcode (ios/)
```

**Publication :**
- **iOS** — finaliser dans Xcode (`ios/App`) : équipe Apple Developer, signing, archive App Store
- Notifications : **Web Push** (PWA) + **push natif iOS via APNs** (clé `.p8`, variables `APNS_*`)

---

## Tests

### Tests E2E (Playwright)

8 parcours couvrant le flux principal :

| Fichier | Scénario |
|---------|----------|
| `01-public.spec.js` | Pages publiques (landing, pricing…) |
| `02-register.spec.js` | Inscription |
| `03-login.spec.js` | Connexion |
| `04-vehicle.spec.js` | Ajout véhicule |
| `05-document.spec.js` | Upload document |
| `06-expense.spec.js` | Ajout dépense |
| `07-alerts.spec.js` | Centre d'alertes |
| `08-auth-guard.spec.js` | Protection des routes |

```bash
# Prérequis : PostgreSQL local avec base carvault_e2e
createdb carvault_e2e

npm run test:e2e              # Lancer les tests
npm run test:e2e:report       # Ouvrir le rapport HTML
```

### Lint

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

---

## Déploiement

### Fly.io (production actuelle)

```bash
# Déployer (build Docker multi-stage automatique)
fly deploy

# Secrets obligatoires
fly secrets set \
  DATABASE_URL="postgresql://..." \
  JWT_SECRET="..." \
  APP_URL="https://carvio.fr" \
  CORS_ORIGIN="https://carvio.fr,capacitor://localhost,ionic://localhost"

# Secrets optionnels (selon fonctionnalités activées)
fly secrets set RAPIDAPI_KEY="..." CARAPI_TOKEN="..." CARAPI_SECRET="..."
fly secrets set R2_ACCOUNT_ID="..." R2_ACCESS_KEY_ID="..." R2_SECRET_ACCESS_KEY="..." R2_BUCKET_NAME="..." R2_PUBLIC_URL="..."
fly secrets set SMTP_HOST="..." SMTP_USER="..." SMTP_PASS="..." SMTP_FROM="..."
fly secrets set STRIPE_SECRET_KEY="..." STRIPE_WEBHOOK_SECRET="..." STRIPE_PRICE_ID="..."
fly secrets set VAPID_PUBLIC_KEY="..." VAPID_PRIVATE_KEY="..."
fly secrets set SENTRY_DSN="..."
```

**Config Fly.io** (`fly.toml`) :
- App : `carvault`, région : `cdg`
- Port interne : `8080`
- Volume monté : `/app/backend/uploads` (fallback si R2 non configuré)
- `release_command` : `npx prisma migrate deploy` (migrations auto au deploy)

### Docker local

```bash
docker build -t carvio .
docker run -p 8080:8080 --env-file backend/.env carvio
```

---

## CI/CD

Pipeline GitHub Actions (`.github/workflows/deploy.yml`) déclenché à chaque push sur `main` :

```
1. Vérifier le code   → lint backend + frontend, prisma validate, build frontend
2. Tests E2E          → Playwright (8 parcours) avec PostgreSQL éphémère
3. Déployer Fly.io    → fly deploy (avec retry sur erreurs 408 transitoires)
```

Secrets GitHub requis : `FLY_API_TOKEN`.

---

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Backend + frontend en parallèle |
| `npm run dev:backend` | Backend seul (nodemon) |
| `npm run dev:frontend` | Frontend seul (Vite) |
| `npm run install:all` | Installer toutes les dépendances |
| `npm run build:frontend` | Build production frontend |
| `npm run cap:sync` | Build + `cap sync` |
| `npm run cap:open:ios` | Ouvrir Xcode |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run test:e2e` | Tests Playwright |
| `docker compose up --build` | Lancer l'app complète (PostgreSQL + API + frontend) |
| `docker compose down` | Arrêter les conteneurs |

---

## Licence

Projet privé — tous droits réservés.
