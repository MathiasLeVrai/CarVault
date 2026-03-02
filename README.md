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

## MVP — Ce qui est livré

| # | Livrable | Statut |
|---|----------|--------|
| 1 | Auth (inscription / connexion JWT) | ✅ |
| 2 | CRUD véhicules + photo + recherche par plaque | ✅ |
| 3 | Upload documents (assurance, CT, carte grise, facture…) + expiration | ✅ |
| 4 | Suivi dépenses + graphiques mensuels | ✅ |
| 5 | Alertes automatiques (cron) avant expiration | ✅ |
| 6 | Score santé véhicule + valeur estimée | ✅ |
| 7 | Export PDF "Dossier pour revente" | ✅ |

## Hors scope (v1)

- Notifications push / email (alertes in-app uniquement pour l'instant)
- Partage de dossier entre utilisateurs
- Scan OCR automatique des documents
- Suivi multi-devises

---

## Roadmap — Priorisation

### Next — Activation / Rétention
> Court terme, fort impact sur l'engagement, effort maîtrisé.

| Feature | Pourquoi | Effort |
|---------|----------|--------|
| Notifications email (J-30 / J-7 / J-1) | Rappels hors app = cœur de la rétention | M |
| Onboarding guidé (3 étapes) | Réduire le temps pour atteindre le "aha moment" | S |
| Snooze / Silence d'une alerte | Éviter le spam + opt-out partiel | S |
| Historique kilométrage | Permet de calculer les intervalles entretien | M |

### Later — Différenciation
> Moyen terme, valeur perçue haute, mais non bloquant pour l'activation.

| Feature | Pourquoi | Effort |
|---------|----------|--------|
| Partage de dossier (lien public) | Revente : envoyer le dossier PDF sans compte | M |
| Dashboard multi-véhicules (vue flotte) | Cible : familles / petites entreprises | L |
| Rappels personnalisables (délais, canaux) | Rétention long terme + power users | M |
| Comparaison coût de possession | Différenciation vs apps concurrentes | L |

### Maybe — R&D / Dépendances externes
> Long terme ou bloqué par des contraintes tierces.

| Feature | Pourquoi Maybe | Effort |
|---------|---------------|--------|
| Scan OCR des documents | Qualité OCR variable, coût API élevé | XL |
| Push notifications (PWA) | Support iOS limité (Safari) | L |
| Import auto depuis les emails (rappels assurance) | Dépendance Gmail/Outlook API | XL |
| Marketplace garages partenaires | Modèle business à valider | XL |

---

## Spécification Notifications

### Canaux (v1 → v2)

| Canal | v1 (actuel) | v2 (next) |
|-------|-------------|-----------|
| In-app (badge + liste alertes) | ✅ | ✅ |
| Email | ❌ | ✅ |
| Push navigateur (PWA) | ❌ | Peut-être |

### Règles de déclenchement par défaut

| Délai avant expiration | Alerte déclenchée |
|------------------------|-------------------|
| J-30 | 1 notification |
| J-7 | 1 notification |
| J-1 | 1 notification |
| J+0 (expiré) | Badge rouge permanent |

- **Fréquence max :** 1 alerte par document par palier (pas de répétition quotidienne).
- **Timezone :** celle du serveur (Europe/Paris). Prévu : stockage timezone utilisateur en v2.
- **Déclencheur :** cron `alert.cron.js` s'exécute toutes les 24h à minuit.

### Opt-out / Anti-spam

- Snooze d'une alerte : **hors scope v1**, prévu en "Next".
- Désactiver toutes les alertes : supprimer les alertes depuis l'interface (pas encore de toggle global).
- Anti-spam : une alerte par (document × palier) — unicité vérifiée avant insertion en base.

### Métriques cibles (v2)

- Taux d'activation notifications email : > 60 %
- Taux d'opt-out : < 15 %
- Taux d'ouverture email : > 35 %

---

## Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, React Router 7, Recharts |
| Backend | Node.js, Express 4, Prisma 6, PostgreSQL (NeonDB) |
| Auth | JWT + bcryptjs |
| Upload | Multer (local → `backend/uploads/`) |
| PDF | PDFKit |
| Alertes | node-cron |
| Déploiement | Docker multi-stage + Fly.io (région CDG) |
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
