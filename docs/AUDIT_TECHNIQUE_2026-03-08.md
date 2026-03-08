# Audit technique complet — RER Tableau de bord

Date: 2026-03-08  
Branche d'audit: `audit/preconisations-maintenance-2026-03-08`

## 1) Résumé exécutif

Le projet est fonctionnel (build OK), mais présente des risques élevés en sécurité applicative, maintenabilité et qualité d'industrialisation.

Points majeurs:
- **Sécurité (P0)**: contrôles d'autorisation incomplets sur des routes critiques, exposition potentielle de `passwordHash`, activation d'impersonation risquée.
- **Qualité/industrialisation (P1)**: absence de tests et de CI versionnée, lint non automatisable, scripts npm cassés.
- **Dette d'architecture (P1/P2)**: duplication forte de logique métier/front, divergence de filtres entre SSR et API, composants très volumineux.
- **Dépendances (P0/P1)**: vulnérabilités de sécurité, dont **1 critique** (`next`), détectées par `npm audit`.

---

## 2) Méthodologie et vérifications effectuées

- Revue manuelle des modules critiques (auth, middleware, routes API admin/articles, Prisma schema, UI render HTML).
- Revue de la documentation et des scripts projet.
- Exécution de contrôles outillés:
  - `npm ci`
  - `npm run build` ✅
  - `npm run lint` ❌ (prompt interactif de configuration ESLint, non CI-compatible)
  - `npm audit --omit=dev --json` ❌ (retourne des vulnérabilités; cf. section dédiée)

---

## 3) Matrice des risques priorisés

### P0 — Critique (à traiter immédiatement)

#### P0-1. Modification d'article sans contrôle d'autorisation robuste
- **Risque**: Critique
- **Preuves**:
  - `app/api/articles/[id]/route.ts:44-49` (session lue mais pas de refus si non autorisé)
  - `app/api/articles/[id]/route.ts:159-173` (update Prisma exécuté sans garde RBAC)
  - `canEditArticles` importé mais non utilisé (`app/api/articles/[id]/route.ts:3`)
- **Impact**: modification potentielle d'articles sans droits adéquats (intégrité métier compromise).
- **Préconisation**:
  1. Introduire un guard central `requireRole()` et `authorizeArticleWrite(user, article, payload)`.
  2. Restreindre strictement les champs sensibles (`auteurId`, `etatId`, `datePublication`) selon rôle.
  3. Ajouter tests d'autorisation API (cas admin/relecteur/auteur/lecteur).

#### P0-2. Reset mot de passe sans contrôle admin
- **Risque**: Critique
- **Preuves**:
  - `app/api/admin/users/[id]/reset-password/route.ts:5-27` (aucun `getSessionUser`, aucun check de rôle)
- **Impact**: prise de contrôle de comptes.
- **Préconisation**:
  1. Exiger `sessionUser.role === "admin"`.
  2. Journaliser l'action (acteur/cible/horodatage).
  3. Durcir la politique mot de passe (>= 12 caractères).

#### P0-3. Exposition de données sensibles (`passwordHash`)
- **Risque**: Critique
- **Preuves**:
  - Modèle: `prisma/schema.prisma:118-127` (`passwordHash` présent sur `User`)
  - API: `app/api/admin/users/route.ts:6-9` (`findMany` sans `select`)
  - API: `app/api/admin/users/route.ts:82`, `app/api/admin/users/[id]/route.ts:33` (retour d'objet `user` brut)
  - API: `app/api/articles/[id]/route.ts:32`, `:170` (`include: { user: true }` dans historiques)
- **Impact**: fuite de hash potentielle via API, risque sécurité majeur.
- **Préconisation**:
  1. DTO explicites + `select` minimal partout (`id`, `email`, `role`, etc.).
  2. Interdire `user: true` dans les includes API exposées.
  3. Ajouter tests de contrat API "champs sensibles interdits".

#### P0-4. Vulnérabilités dépendances en production (dont critique)
- **Risque**: Critique
- **Preuves (`npm audit --omit=dev`)**:
  - `next@14.2.18` vulnérable, fix dispo `14.2.35` (inclut advisory critique middleware bypass)
  - `xlsx@0.18.5` vulnérable (Prototype Pollution / ReDoS), pas de fix auto proposée par npm
  - `bcrypt@5.1.1` chain vulnérable via `@mapbox/node-pre-gyp`/`tar`, fix majeur `bcrypt@6`
- **Impact**: exposition à bypass auth middleware, DoS, vulnérabilités transitives.
- **Préconisation**:
  1. Mettre à jour **immédiatement** `next` vers version patchée.
  2. Évaluer remplacement/upgrade de `xlsx` (version sûre ou alternative).
  3. Planifier migration `bcrypt` vers v6 avec tests de non-régression auth.

---

### P1 — Élevé (sprint en cours)

#### P1-1. Endpoints `/api/admin/*` en GET sans contrôle admin explicite
- **Risque**: Élevé
- **Preuves**:
  - `app/api/admin/mutuelles/route.ts:5-10`
  - `app/api/admin/rubriques/route.ts:5-10`
  - `app/api/admin/formats/route.ts:5-10`
  - `app/api/admin/auteurs/route.ts:5-14`
  - `app/api/admin/users/route.ts:5-17`
- **Impact**: exposition de données administratives à des utilisateurs non-admin authentifiés.
- **Préconisation**: appliquer systématiquement `requireRole("admin")` sur GET/POST/PATCH/DELETE des routes admin.

#### P1-2. Impersonation activable via variable publique
- **Risque**: Élevé
- **Preuves**:
  - `lib/auth-options.ts:56-58` (`NEXT_PUBLIC_ENABLE_USER_SWITCH` utilisé côté serveur)
  - `lib/auth-options.ts:72-79` (provider impersonation avec simple lookup email)
- **Impact**: usurpation potentielle si flag activé par erreur.
- **Préconisation**:
  1. Retirer toute dépendance à `NEXT_PUBLIC_*` pour ce flux.
  2. Activer uniquement en environnement non-prod + garde admin stricte.
  3. Tracer et auditer les sessions d'impersonation.

#### P1-3. HTML non sanitizé + `dangerouslySetInnerHTML`
- **Risque**: Élevé
- **Preuves**:
  - Stockage direct: `app/api/articles/route.ts:251-256`, `app/api/articles/[id]/route.ts:92-99`
  - Rendu direct:
    - `app/articles/[id]/page.tsx:285-288`
    - `app/articles/ArticleReadSidePanel.tsx:243`
    - `app/articles/ArticlesCardsExplorer.tsx:530`
    - `app/mes-articles/MesArticleSidePanel.tsx:430`
- **Impact**: risque XSS stockée.
- **Préconisation**:
  1. Sanitization serveur stricte avant persistance.
  2. Définir une allowlist de tags/attributs.
  3. Ajouter une CSP stricte (complément, pas substitut).

#### P1-4. Lint non industrialisable + absence de CI versionnée
- **Risque**: Élevé
- **Preuves**:
  - `npm run lint` ouvre un assistant interactif Next.js (pas de config ESLint commitée)
  - Absence `.eslintrc*` et `.github/workflows/*.yml`
- **Impact**: qualité non contrôlée en continu, risque fort de régressions.
- **Préconisation**:
  1. Committer une config ESLint.
  2. Ajouter CI minimale: `npm ci`, `npm run lint`, `npm run build`.
  3. Ajouter `npm run typecheck` explicite.

#### P1-5. Scripts npm référencent des fichiers absents
- **Risque**: Élevé
- **Preuves**:
  - `package.json:13-14` (`prisma/seed.ts`, `scripts/import-xlsx.ts`)
  - Fichiers absents dans le repo.
- **Impact**: onboarding/déploiement fragiles, commandes documentées non exécutables.
- **Préconisation**: restaurer ces scripts/fichiers ou supprimer/réviser les scripts.

---

### P2 — Moyen (prochain sprint)

#### P2-1. Violation de règle React Hooks
- **Risque**: Moyen
- **Preuves**:
  - `app/articles/depot/page.tsx:322-328` (return conditionnel)
  - puis hooks déclarés après (`:330-331`)
- **Impact**: comportement runtime non déterministe, bug difficile à diagnostiquer.
- **Préconisation**: remonter tous les hooks avant tout `return` conditionnel.

#### P2-2. Divergence de logique de filtres entre SSR et API
- **Risque**: Moyen
- **Preuves**:
  - SSR: `app/articles/page.tsx:88-102` (filtre sur `createdAt`)
  - API: `app/api/articles/route.ts:71-88` (logique `datePublication` OU fallback `createdAt`)
- **Impact**: incohérence des résultats (chargement initial vs pagination/infinite scroll).
- **Préconisation**: extraire un query-builder partagé unique.

#### P2-3. Duplication importante de logique front métier
- **Risque**: Moyen
- **Preuves**:
  - Multiples composants volumineux (`AdminReviewExplorer`, `MesArticleSidePanel`, etc.)
  - Fonctions utilitaires et types redéfinis dans plusieurs vues articles.
- **Impact**: coût de maintenance élevé et risque de divergence.
- **Préconisation**:
  1. Créer `features/articles/` avec services + types + helpers partagés.
  2. Extraire les transformations HTML/date/URL en utilitaires communs.

#### P2-4. Documentation partiellement obsolète
- **Risque**: Moyen
- **Preuves**:
  - `docs/deploiement.md:39` mentionne `POST /api/upload` (alors que route actuelle `POST /api/upload-url`)
  - `docs/SUIVI.md` mentionne des flux/pages plus alignés.
- **Impact**: erreurs opérationnelles et onboarding ralenti.
- **Préconisation**: synchroniser docs avec l'implémentation actuelle à chaque release.

---

### P3 — Faible (amélioration continue)

#### P3-1. Observabilité et garde-fous opérationnels limités
- **Risque**: Faible à moyen
- **Preuves**:
  - Logs majoritairement `console.error`
  - Absence de stratégie centralisée d'observabilité.
- **Impact**: MTTR plus long en production.
- **Préconisation**: logger structuré + correlation id + dashboards erreurs/latence.

#### P3-2. Warnings d'environnement Supabase pendant le build
- **Risque**: Faible
- **Preuves**:
  - build affiche `[supabase-server] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant...`
- **Impact**: bruit de build, confusion sur readiness des environnements.
- **Préconisation**: clarifier stratégie d'env (dev/build/prod) et documenter les variables minimales.

---

## 4) Plan de remédiation recommandé

## Phase immédiate (J+1 à J+3)
1. Corriger authz sur `PATCH /api/articles/[id]`.
2. Protéger `POST /api/admin/users/[id]/reset-password`.
3. Bloquer toute fuite de `passwordHash` (DTO/select minimal).
4. Mettre à jour `next` vers version patchée (14.2.35 min).

## Sprint suivant (1 semaine)
1. Uniformiser RBAC via helpers centraux (`requireAuth`, `requireRole`, `forbidden`).
2. Ajouter config ESLint + CI minimale + `typecheck`.
3. Restaurer ou nettoyer scripts npm invalides.
4. Ajouter sanitization HTML côté serveur.

## 2 à 4 semaines
1. Introduire couche service/domain (articles/admin).
2. Dédupliquer query/filtres (SSR + API).
3. Poser une base de tests (API authz + flux critiques).
4. Mettre à jour docs techniques/runbooks.

---

## 5) Backlog d'actions (priorisé, prêt à ticketiser)

| ID | Priorité | Action | Effort estimé | Risque réduit |
|---|---|---|---:|---|
| SEC-01 | P0 | Guard RBAC strict sur `PATCH /api/articles/[id]` | 0.5-1 j | Critique |
| SEC-02 | P0 | Guard admin sur reset-password | 0.5 j | Critique |
| SEC-03 | P0 | DTO `UserSafe` + suppression `passwordHash` dans API | 0.5-1 j | Critique |
| DEP-01 | P0 | Upgrade `next` patché + vérif non-régression | 0.5 j | Critique |
| SEC-04 | P1 | Sécuriser impersonation (server-only, non-prod) | 0.5 j | Élevé |
| APP-01 | P1 | Sanitization HTML + CSP baseline | 1-2 j | Élevé |
| QLT-01 | P1 | ESLint config commitée + script non interactif | 0.5 j | Élevé |
| QLT-02 | P1 | CI baseline (lint/build/typecheck) | 0.5-1 j | Élevé |
| DEVX-01 | P1 | Corriger scripts npm absents | 0.5 j | Élevé |
| FE-01 | P2 | Fix hooks order `/articles/depot` | 0.25 j | Moyen |
| ARC-01 | P2 | Query-builder filtres partagé SSR/API | 1-2 j | Moyen |
| ARC-02 | P2 | Extraire helpers/types communs articles | 1-2 j | Moyen |

---

## 6) Conclusion

L'application est proche d'un niveau production côté fonctionnalités, mais nécessite un **hardening immédiat** sur la sécurité et l'industrialisation.  
La priorité absolue est de traiter les items P0, puis de verrouiller une baseline qualité (CI + lint + typecheck + premiers tests d'autorisation).

