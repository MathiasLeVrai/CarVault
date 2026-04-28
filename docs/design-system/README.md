# Carvio — Design System & UML

## 1. Design System

### 1.1 Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#ff2a3f` | CTA principal, badges critiques |
| `sky` | `#38bdf8` | Info, état neutre positif |
| `lime` | `#22c55e` | Succès, santé véhicule A/B |
| `violet` | `#7c5cfc` | Premium, gamification |
| `amber` | `#f59e0b` | Warning, expirations proches |
| `ink` | `#0b0b0f` | Background dark |
| `paper` | `#fafafa` | Background light |

### 1.2 Typographie
- **Display** : Clash Display (`font-display`) — titres, hero
- **Sans** : Satoshi — corps de texte, UI
- Tailles : `text-xs` 12, `text-sm` 14, `text-base` 16, `text-lg` 18, `text-xl` 20, `text-2xl` 24, `text-4xl` 36, `text-6xl` 60

### 1.3 Composants CSS (Tailwind 4 tokens)
| Classe | Rôle |
|--------|------|
| `cv-card` | Carte conteneur avec rounded-2xl + border subtile |
| `cv-btn-accent` | Bouton CTA rouge accent |
| `cv-btn-dark` | Bouton secondaire fond sombre |
| `cv-input` | Input avec focus ring accent |
| `glass-panel` | Panneau backdrop-blur + border blanche 10% |
| `bento-card` | Carte dashboard style bento grid |

### 1.4 Motion
- **Framer Motion** : spring `damping: 26-30`, `stiffness: 280-320`
- Transitions UI : `duration-200 ease-out` par défaut
- Sheets bottom (mobile) : spring damping 28

### 1.5 Layout
- Mobile-first, bottom nav + FAB (`QuickActionSheet`)
- Safe area : `pb-safe` pour iOS notch
- Breakpoints : `sm` 640, `md` 768, `lg` 1024, `xl` 1280

### 1.6 Feedback
- **Toasts** : `useToast()` depuis `ToastContext` — variants `success | error | info`
- **Modales** : backdrop noir 60%, panneau `cv-card` centré
- **Premium gating** : `PremiumModal` déclenché sur code API `PREMIUM_REQUIRED` (403)

---

## 2. Diagrammes UML

Tous les diagrammes sont en **PlantUML**. Rendu : `plantuml file.puml` ou [plantuml.com/plantuml](https://www.plantuml.com/plantuml).

| Diagramme | Fichier | Portée |
|-----------|---------|--------|
| Cas d'utilisation | [uml-use-cases.puml](uml-use-cases.puml) | Acteurs × fonctionnalités |
| Composants | [uml-components.puml](uml-components.puml) | Modules frontend + backend + externes |
| Paquets | [uml-packages.puml](uml-packages.puml) | Organisation des dossiers |
| Déploiement | [uml-deployment.puml](uml-deployment.puml) | Infrastructure Fly.io + services tiers |
| Séquence — Login + Refresh | [uml-sequence-login.puml](uml-sequence-login.puml) | Auth JWT + rotation refresh token |
| Séquence — Ajout véhicule | [uml-sequence-add-vehicle.puml](uml-sequence-add-vehicle.puml) | Avec check premium |
| Séquence — Stripe checkout | [uml-sequence-stripe.puml](uml-sequence-stripe.puml) | Paiement + webhook |
| Séquence — Reset password | [uml-sequence-password-reset.puml](uml-sequence-password-reset.puml) | Flow email + token |
| Séquence — Carte carburants | [uml-sequence-fuel-prices.puml](uml-sequence-fuel-prices.puml) | Cache + API gouv |
