# Suivi du projet – Plateforme RER Tableau de bord V2

Fichier mis à jour à chaque fin d’étape ou de sprint. Objectif : tracer l’avancement, les tests en serveur local, les points bloquants et les décisions.

---

## Choix et décisions

| Date       | Décision / point bloquant | Note |
| ---------- | ------------------------- | ----- |
| 21/02/2025 | BDD : Supabase (pas de PostgreSQL local) | Partage client + simplicité |

---

## Phase 1 – Sprints

### Sprint 1 – BDD, seed, import

| Étape | Statut | Test local | Date |
| ----- | ------ | ---------- | ---- |
| Initialisation projet (Next.js, deps, .env) | À faire | — | |
| Schéma BDD (tables, migrations) | Fait | — | 2025-02 |
| Seed référentiels (états, rubriques, formats, mutuelles) | Fait | — | 2025-02 |
| Script d’import xlsx + rapport | Fait | — | 2025-02 |
| **Critère de fin** : données migrées consultables (page ou CLI) | — | BDD OK, seed + import OK | |

**À faire de ton côté :**  
1. `npm install`  
2. Copier `.env.example` en `.env`, renseigner `DATABASE_URL` (PostgreSQL).  
3. `npm run db:generate` puis `npm run db:migrate`  
4. `npm run db:seed`  
5. `npm run import:xlsx` (rapport dans `scripts/rapport-import.txt`)  
6. `npm run dev` → ouvrir http://localhost:3000 et vérifier compteurs + `/api/articles`

**Résultat test serveur local (fin Sprint 1) :**  
21/02/2025 — OK. BDD Supabase connectée. Page d’accueil affiche 353 articles, 27 auteurs, 10 mutuelles. Bouton « API Liste articles » → `/api/articles` renvoie la liste en JSON. Sprint 1 terminé.

---

### Sprint 2 – Auth et rôles

| Étape | Statut | Test local | Date |
| ----- | ------ | ---------- | ---- |
| Auth (inscription, connexion) | Fait | — | 2025-02 |
| Rôles (Admin, Relecteur, Auteur, Lecteur) | Fait | — | 2025-02 |
| Middleware / gardes par rôle | Fait | — | 2025-02 |
| Association user ↔ auteur (champ en session) | Fait | — | 2025-02 |
| **Critère de fin** : connexion par rôle, accès différencié | — | Connexion chaque rôle, droits OK | |

**Comptes de test :** admin@rer.local, relecteur@rer.local, auteur@rer.local (mot de passe : `rer2025`). Recréer avec `npm run db:seed` si besoin.

**Résultat test serveur local (fin Sprint 2) :**  
OK. Connexion avec admin@rer.local, relecteur@rer.local, auteur@rer.local (mot de passe rer2025). Rôle affiché dans le header, tableau de bord accessible, déconnexion OK. Sprint 2 terminé.

---

### Sprint 3 – Liste, détail, dépôt, photo

| Étape | Statut | Test local | Date |
| ----- | ------ | ---------- | ---- |
| Liste articles (filtres, recherche, pagination) | Fait | — | 2025-02 |
| Détail article (affichage, drawer/panneau) | Fait | — | 2025-02 |
| Upload photo (stockage interne) | Fait | — | 2025-02 |
| Formulaire dépôt (saisie directe) | Fait | — | 2025-02 |
| **Critère de fin** : navigation lecture + dépôt avec photo | — | Parcourir liste, ouvrir article, déposer avec photo | |

**Réalisations :** Bouton « OK » pour appliquer la recherche ; API `POST /api/upload` (fichiers dans `public/uploads`) ; page `/articles/depot` avec formulaire (titre, auteur, mutuelle, rubrique, format, chapô, contenu, légende, post RS, photo, lien Google Doc) et guidage signes (référence du format + compteur temps réel) ; API `POST /api/articles` pour créer un article (état « À relire ») ; lien « Déposer un article » sur la page liste.

**Résultat test serveur local (fin Sprint 3) :**  
_(à remplir après vérification : liste, filtres, pagination, détail, dépôt avec photo)_

---

### Sprint 4 – Import Word, relecture, exports

| Étape | Statut | Test local | Date |
| ----- | ------ | ---------- | ---- |
| Import Word (.docx → pré-remplissage) | Fait | — | 2025-02 |
| Relecture (édition, workflow états, historique) | Fait | — | 2025-02 |
| Exports (Word, HTML, Texte) | Fait | — | 2025-02 |
| **Critère de fin** : cycle dépôt → relecture → export | — | Import .docx, corriger, changer état, télécharger export | |

**Réalisations :**  
- **Import Word** : API `POST /api/import-word` (mammoth), bouton « Importer un Word » sur la page dépôt, pré-remplissage titre / chapô / contenu.  
- **Relecture** : `PATCH /api/articles/[id]` (relecteur/admin), création d’un `ArticleHistorique` à chaque changement d’état ; page `/articles/[id]/edit` (formulaire + sélecteur d’état + liste historique) ; bouton « Corriger » sur la fiche article (visible relecteur/admin).  
- **Exports** : API `GET /api/articles/[id]/export?format=txt|html|word` (texte brut, HTML, Word-compatible) + boutons TXT/HTML/Word sur la fiche article.

**Résultat test serveur local (fin Sprint 4) :**  
À tester plus tard (import .docx, édition, changement d’état, téléchargements TXT/HTML/Word).

---

### Sprint 5 – UI/UX, déploiement, doc

| Étape | Statut | Test local | Date |
| ----- | ------ | ---------- | ---- |
| Charte, responsive, accessibilité, messages | En cours | — | |
| Déploiement (OVH ou Supabase) | En cours | — | 2025-02 |
| Comptes de test (auteur, relecteur, admin) | En place (seed) | — | |
| Documentation utilisateur et technique | En cours | — | 2025-02 |
| **Critère de fin** : Phase 1 livrée et déployée | — | Vérification finale `npm run dev` puis prod | |

**Réalisations UX récentes :**

- Mise en place de la vue **Explorer** sur `/articles` (liste compacte à gauche + panneau de prévisualisation à droite, drawer sur mobile).
- Amélioration de la lecture rapide : chapô mis en valeur, raccourcis clavier (flèches, Entrée, Ctrl/⌘+E), boutons de copie **HTML** et **texte formaté**, export Word relégué en action tertiaire.
- Cartes de la colonne Explorer modernisées (sélecteur visuel, placement des pastilles, micro-interactions).

**À faire (images et pagination avancée) :**

- Définir où et comment seront **hébergées les photos** (CDN/bucket ou autre) et ajouter une route d’API dédiée pour un téléchargement fiable (`Content-Disposition: attachment`).
- Généraliser et stabiliser le **scroll infini** sur toutes les vues de `/articles` (Cartes, Explorer, Tableau) en s’appuyant sur l’API paginée `/api/articles` et en supprimant la pagination classique.

**Documentation utilisateur :** [docs/utilisation.md](utilisation.md) (connexion, dépôt, import Word, relecture). **Déploiement :** Guide rédigé dans [docs/deploiement.md](docs/deploiement.md) (Vercel, Supabase, OVH). À faire : choisir l’hébergeur, configurer les variables d’env, lancer les migrations, déployer. UX éditeur de dépôt à retravailler plus tard.

**Résultat test serveur local (fin Sprint 5) :**  
_(à remplir)_

---

## Phase 2

À remplir après validation de la Phase 1 (même format : sprints, étapes, statut, tests locaux).

---

## Commandes utiles

- **Serveur local :** `npm run dev` (ou `next dev` selon le projet)
- **Build :** `npm run build`
- **Lint :** `npm run lint`

## Documentation disponible

| Fichier | Contenu |
| ------- | ------- |
| [docs/utilisation.md](utilisation.md) | Guide utilisateur : connexion, explorer la base, dépôt (saisie + import Word), relecture (corriger, états, historique). À tester plus tard. |
| [docs/deploiement.md](deploiement.md) | Déploiement (Vercel, Supabase, OVH), variables d’env, checklist. |
| [docs/plan.md](plan.md) | Plan du projet, analyse BDD, sprints. |
