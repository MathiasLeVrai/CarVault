# Lessons

## Vérifier qu'un composant est réellement utilisé avant de le traiter comme une feature active
- **Contexte** : audit config Capacitor iOS. J'ai trouvé `PlateScanModal.jsx` (scan de plaque via caméra + tesseract.js) et j'en ai déduit que la feature existait → j'ai ajouté la permission `NSCameraUsageDescription`. En réalité la feature avait été retirée ; le composant était du code mort, importé nulle part.
- **Règle** : quand un `grep` remonte un composant/feature, vérifier qu'il est **importé et atteignable** (`grep -rn "import.*<Composant>"`) avant de conclure qu'il est vivant. La présence d'un fichier ≠ feature active.
- **Corollaire** : du code mort entraîne des permissions natives inutiles (motif de rejet Apple : déclarer une API non utilisée) et de la pub mensongère (la FAQ landing vantait encore le scan de plaque).

## Garder le CLI `prisma` et `@prisma/client` sur la même version majeure
- **Contexte** : commit "maj prisma" (051602c) a monté `@prisma/client` de ^6.2.0 → ^7.8.0 mais laissé le CLI `prisma` en ^6.x. La CI a échoué sur `npx prisma generate` : `Cannot find module '.../@prisma/client/runtime/query_engine_bg.postgresql.wasm-base64.js'` — le CLI v6 cherchait un fichier moteur que le client v7 n'expose plus.
- **Règle** : `prisma` (devDep) et `@prisma/client` (dep) doivent **toujours** partager la même version majeure. Lors d'un bump, modifier les deux ligne à ligne, puis `npm install` et reproduire localement les étapes CI : `prisma validate` + `prisma generate`.
- **Corollaire (breaking change v7)** : Prisma 7 supprime `url = env("DATABASE_URL")` du `schema.prisma` → exige `prisma.config.ts` + un driver adapter (`@prisma/adapter-pg` + `pg`) et `new PrismaClient({ adapter })`. Un bump v6→v7 n'est donc PAS un simple bump : c'est une migration qui touche la connexion Neon en prod. En cas de doute, rollback sur v6 (état prouvé stable) plutôt que migration à chaud.
