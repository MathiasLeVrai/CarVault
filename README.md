# CarVault - Centre de gestion intelligent de véhicule

Application SaaS moderne permettant aux particuliers de centraliser, organiser et analyser tous les documents et dépenses liés à leurs véhicules.

## Stack technique

**Frontend:** React (Vite) + TailwindCSS + Recharts + React Router v6
**Backend:** Node.js + Express + PostgreSQL + Prisma ORM + JWT Auth

## Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm

## Installation

```bash
# 1. Installer toutes les dépendances
npm run install:all

# 2. Configurer la base de données
# Éditer backend/.env avec vos paramètres PostgreSQL

# 3. Générer le client Prisma et exécuter les migrations
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..

# 4. Lancer l'application (backend + frontend simultanément)
npm run dev
```

L'application sera disponible sur:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## Structure du projet

```
CarVault/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Schéma de base de données
│   ├── src/
│   │   ├── controllers/           # Contrôleurs HTTP
│   │   ├── services/              # Logique métier
│   │   ├── routes/                # Définition des routes
│   │   ├── middleware/            # Auth, upload, erreurs
│   │   ├── lib/                   # Client Prisma
│   │   └── index.js               # Point d'entrée serveur
│   └── uploads/                   # Stockage fichiers (local)
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Pages de l'application
│   │   ├── components/            # Composants réutilisables
│   │   │   └── ui/                # Composants UI de base
│   │   ├── layouts/               # Layouts (Dashboard)
│   │   ├── context/               # AuthContext
│   │   ├── services/              # Client API
│   │   └── utils/                 # Helpers et constantes
│   └── index.html
└── package.json                   # Scripts racine
```

## Fonctionnalités

- **Authentification** sécurisée (JWT)
- **Dashboard** avec graphiques et alertes
- **Gestion des véhicules** (CRUD complet avec photo)
- **Documents** (upload, types, expiration, filtres)
- **Dépenses** (catégories, graphiques, statistiques)
- **Alertes** (expiration documents, notifications)

## API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/profile` | Profil utilisateur |
| GET | `/api/dashboard` | Données dashboard |
| GET/POST | `/api/vehicles` | Liste/Création véhicules |
| GET/PUT/DELETE | `/api/vehicles/:id` | Détail/MAJ/Suppression |
| GET/POST | `/api/documents` | Liste/Création documents |
| GET/POST | `/api/expenses` | Liste/Création dépenses |
| GET | `/api/expenses/stats` | Statistiques dépenses |
| GET/PUT/DELETE | `/api/alerts` | Gestion alertes |
