# CarVault — Gestion intelligente de véhicules

Application **PWA mobile-first** permettant aux particuliers de centraliser documents, dépenses et rappels liés à leurs véhicules. Installable sur l'écran d'accueil (iOS/Android), utilisable hors-ligne grâce au Service Worker. En moins de 5 minutes, l'utilisateur ajoute son véhicule, attache ses documents clés et reçoit automatiquement des alertes d'expiration.

**Production :** [carvault.fly.dev](https://carvault.fly.dev)

---

## Moment "aha" — Parcours d'activation

```
1. Créer un compte
2. Ajouter un véhicule (ou chercher par plaque)
3. Uploader 1 document avec une date d'expiration (ex. assurance, CT)
4. Recevoir automatiquement un rappel avant expiration
```

Objectif : atteindre "1 véhicule + 1 doc + 1 rappel planifié" en < 5 min.

---

## Fonctionnalités principales (v2)

Pour un brief produit détaillé, voir `PRODUCT.md`.

- **Coffre-fort de documents**: upload de tous les documents liés au véhicule (assurance, carte grise, CT, factures, garanties…) avec dates d’expiration.
- **Rappels intelligents**: rappels configurables (J-30, J-14, J-7, J-1, J+0) par document, avec centre de notifications et préférences utilisateur.
- **Suivi dépenses & entretien**: catégories de dépenses, kilométrage, carburant, statistiques mensuelles et annuel, coût de possession.
- **Score santé véhicule**: score /100 (A–D), estimation de valeur et indicateurs de risque.
- **Dossier revente**: export PDF complet, partage via lien public sécurisé (token, expiration).
- **Dashboard d’action**: vue synthétique des prochaines actions (docs à renouveler, CT à passer, entretiens à prévoir).
- **Onboarding guidé**: parcours simple pour créer un compte, ajouter un véhicule et atteindre rapidement le moment "aha".
- **PWA mobile-first**: installable sur écran d’accueil, fonctionnement hors ligne via Service Worker.

## Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, React Router 7, Recharts |
| Backend | Node.js, Express 4, Prisma 6, PostgreSQL (NeonDB), Nodemailer, Stripe |
| Auth | JWT + bcryptjs |
| Upload | Multer (local en dev → volume Fly.io en prod) |
| PDF | PDFKit |
| Alertes | node-cron (jobs récurrents pour rappels d’expiration) |
| Déploiement | Docker multi-stage + Fly.io (région CDG) + GitHub Actions (CI/CD) |
| APIs tierces | RapidAPI (plaque FR), CarAPI (marques/modèles) |

---

## Lancer le projet en local (< 30 min)

### Prérequis

- Node.js 18+
- PostgreSQL 14+ (ou une URL NeonDB)
- npm

### Installation

```bash
# 1. Dépendances (racine + backend + frontend)
npm run install:all

# 2. Variables d'environnement
cp backend/.env.example backend/.env
# Renseigner DATABASE_URL, JWT_SECRET, RAPIDAPI_KEY dans backend/.env

# 3. Migrations + client Prisma
cd backend
npx prisma migrate dev --name init
cd ..

# 4. Démarrer (backend :3001 + frontend :5173)
npm run dev
```

**Frontend :** http://localhost:5173  
**API :** http://localhost:3001

**Documentation Swagger (OpenAPI 3)** : http://localhost:3001/api/docs — JSON brut : http://localhost:3001/api/docs.json  
Désactivation : `SWAGGER_ENABLED=false` dans `backend/.env`.

> Le frontend proxifie automatiquement `/api` et `/uploads` vers le backend via Vite (voir `vite.config.js`).

---

## Structure du projet

```
CarVault/
├── Dockerfile                  ← build multi-stage (frontend → backend → image unique)
├── fly.toml                    ← config Fly.io
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← modèles (User, Vehicle, Document, Expense, Alert)
│   │   └── migrations/         ← migrations SQL versionnées
│   ├── src/
│   │   ├── controllers/        ← HTTP handlers (auth, vehicle, document, expense, alert)
│   │   ├── services/           ← logique métier (pdf, health, plate, carapi, alert…)
│   │   ├── routes/             ← routes Express
│   │   ├── middleware/         ← auth JWT, erreurs, upload multer
│   │   └── cron/               ← alertes automatiques planifiées
│   └── uploads/                ← fichiers uploadés (local en dev, volume en prod)
└── frontend/
    ├── src/
    │   ├── pages/              ← Dashboard, Vehicles, VehicleDetail, Documents, Expenses, Alerts
    │   ├── components/ui/      ← Button, Modal, Input, Badge, Card…
    │   ├── context/            ← AuthContext, ThemeContext
    │   ├── services/api.js     ← tous les appels API
    │   └── utils/helpers.js    ← labels, formateurs
    └── public/sw.js            ← Service Worker (PWA / cache offline)
```

---

## API — Spécification v1

**Auth :** toutes les routes (sauf `/api/auth/*`) requièrent `Authorization: Bearer <JWT>`.  
**Erreurs communes :** `400` champ manquant · `401` token invalide/expiré · `404` ressource introuvable · `500` erreur serveur.  
**Format :** JSON (sauf upload multipart).

---

### Auth

#### `POST /api/auth/register`
```json
// Body
{ "email": "user@mail.com", "password": "motdepasse", "firstName": "Jean", "lastName": "Dupont" }

// 201 Created
{ "token": "<jwt>", "user": { "id": "uuid", "email": "...", "firstName": "Jean", "lastName": "Dupont" } }
```

#### `POST /api/auth/login`
```json
// Body
{ "email": "user@mail.com", "password": "motdepasse" }

// 200 OK
{ "token": "<jwt>", "user": { "id": "uuid", "email": "...", "firstName": "Jean" } }
```

#### `GET /api/auth/profile`
```json
// 200 OK
{ "id": "uuid", "email": "...", "firstName": "Jean", "lastName": "Dupont", "createdAt": "..." }
```

---

### Véhicules

#### `GET /api/vehicles`
```json
// 200 OK — tableau
[{ "id": "uuid", "brand": "Peugeot", "model": "308", "year": 2020, "mileage": 45000,
   "licensePlate": "AB-123-CD", "fuelType": "DIESEL", "photo": "/uploads/vehicles/xxx.jpg",
   "_count": { "documents": 3, "expenses": 12 } }]
```

#### `POST /api/vehicles` — multipart/form-data
```
Fields: brand*, model*, year*, mileage, licensePlate, color, fuelType, purchasePrice, photo (file)
// 201 Created → objet Vehicle complet
```

#### `GET /api/vehicles/:id`
```json
// 200 OK — véhicule + 5 derniers docs + 10 dernières dépenses + stats année
{ "id": "...", "brand": "...", "documents": [...], "expenses": [...],
  "stats": { "totalExpensesYear": 1240.50, "monthlyExpenses": [{ "month": 1, "total": 80 }] },
  "health": { "score": 74, "grade": "B", "estimatedValue": 12500 } }
```

#### `GET /api/vehicles/:id/pdf`
```
// 200 OK — Content-Type: application/pdf
// Retourne un buffer PDF (dossier revente)
```

---

### Documents

#### `POST /api/documents` — multipart/form-data
```
Fields: name*, type* (INSURANCE|TECHNICAL_INSPECTION|INVOICE|WARRANTY|REGISTRATION|OTHER),
        vehicleId*, expirationDate (ISO date), notes, file* (pdf/image)
// 201 Created → objet Document
```

#### `GET /api/documents?type=INSURANCE`
```json
// 200 OK — filtre par type optionnel
[{ "id": "...", "name": "Assurance MAAF 2026", "type": "INSURANCE",
   "filePath": "/uploads/documents/xxx.pdf", "expirationDate": "2026-12-31",
   "vehicle": { "brand": "Peugeot", "model": "308" } }]
```

---

### Dépenses

#### `POST /api/expenses`
```json
// Body
{ "vehicleId": "uuid", "amount": 150.50, "category": "MAINTENANCE",
  "date": "2026-02-10", "description": "Vidange + filtres", "mileage": 45200 }
// 201 Created → objet Expense
```

#### `GET /api/expenses/stats`
```json
// 200 OK
{ "totalAll": 3240.00, "totalYear": 890.50, "byCategory": { "MAINTENANCE": 450, "FUEL": 340 },
  "avgMonthly": 74.20 }
```

---

### Alertes

#### `GET /api/alerts`
```json
// 200 OK
[{ "id": "...", "title": "Assurance expire bientôt", "message": "...",
   "type": "DOCUMENT_EXPIRY", "isRead": false, "dueDate": "2026-03-01" }]
```

#### `PUT /api/alerts/:id` — Marquer comme lu
```json
// Body
{ "isRead": true }
// 200 OK → alerte mise à jour
```

---

### Lookup plaque

#### `GET /api/brands/plate/:plate`
```json
// Exemple : GET /api/brands/plate/AB-123-CD
// 200 OK
{ "licensePlate": "AB-123-CD", "brand": "Peugeot", "model": "308", "year": 2020,
  "fuelType": "DIESEL", "color": "Gris", "horsepower": 130, "doors": 5 }
// 404 si plaque non trouvée
```

---

## Déployer

```bash
# Déployer sur Fly.io (Docker multi-stage automatique)
fly deploy

# Configurer les secrets en production
fly secrets set DATABASE_URL="..." JWT_SECRET="..." RAPIDAPI_KEY="..."
.gitignore
