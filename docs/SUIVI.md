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

**Dates, copies et nouvelles pages :**

- Clarification de la sémantique des dates :  
  - `dateDepot` = date de dépôt par l’utilisateur (import historique ou dépôt en ligne).  
  - `datePublication` = date de validation par un relecteur/admin (premier passage à l’état « valide », figée ensuite).  
  - `createdAt` / `updatedAt` = dates techniques (création / dernière modification).  
- Affichage unifié dans l’UI : sur les cartes (Cartes, Explorer, Tableau) et la fiche article, la date affichée est toujours **« Publié le JJ/MM/AAAA »** calculée via `datePublication ?? dateDepot ?? createdAt`.  
- Filtres de date sur `/articles` : boutons **Depuis 1 / 3 / 6 mois** + **période personnalisée**, qui filtrent sur `datePublication` (si renseignée) avec repli sur `createdAt` pour les articles plus anciens.  
- Boutons de copie dans la vue Explorer : **« Copier HTML »** (HTML propre, prêt à coller dans un CMS) et **« Copier texte »** (texte simple structuré, compatible Google Docs / Word) + export Word en option tertiaire.  
- Navigation principale enrichie dans le header : liens **Articles**, **Mes articles** et **Relecteurs** accessibles pour l’instant à tous les utilisateurs.  
- Création des pages dédiées :  
  - `/mes-articles` → redirection vers `/articles?mine=1` (filtre « mes articles » à implémenter côté backend).  
  - `/relecteurs` → redirection vers `/articles?view=explorer&mode=relecteur` (future vue dédiée relecteurs/admin).
  - Backend mis à jour : le paramètre `mine=1` de `/api/articles` filtre désormais les articles sur `auteurId` (utilisateur connecté), et `/relecteurs` s’appuie sur un layout spécifique avec sidebar pliable.

**À faire (images et pagination avancée) :**

- Définir où et comment seront **hébergées les photos** (CDN/bucket ou autre) et ajouter une route d’API dédiée pour un téléchargement fiable (`Content-Disposition: attachment`).
- Stabiliser et monitorer le **scroll infini** sur les trois vues de `/articles` (Cartes, Explorer, Tableau) déjà branchées sur l’API paginée `/api/articles` (performances, UX mobile).

### Charte graphique RER – tableau de bord

**Palette de couleurs (approximations à affiner via l’inspecteur)**

- **Fond appli / dashboard** : `#F5F7FA` (fond très clair), `#FFFFFF` (cartes, panneaux).  
- **Fond éditorial (inspiré du site)** : `#F7F3E2` (crème).  
- **Bleu RER principal** : `#243B8F` – entêtes importantes, onglet actif, liens majeurs.  
- **Orange RER d’accent** : `#F1663C` – boutons primaires, titres forts sur fond bleu, mises en avant.  
- **Neutres / texte** : `#111827` (texte principal), `#4B5563` (secondaire), `#9CA3AF` (texte peu important), `#E5E7EB` (bordures).

**Badges / statuts**

- Santé / positif / validé : fond `#D1FAE5`, texte `#047857`.  
- Rubriques (exemples) : Santé `#16A34A`, Vie pratique `#EA580C`, Société `#DB2777`, Produits & services `#0EA5E9`.  
- Formats : Article (fond `#E5E7EB`, texte foncé), Dossier `#6366F1`, Brève `#EC4899`.

**Typographie**

- Police de base :  
  ```css
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  ```  
- H1 (titre de page) : 28–32 px, `font-extrabold`/`font-black`, couleur `#111827`.  
- H2 (sections) : 20–22 px, `font-semibold`.  
- Titre de carte article : 16–18 px, `font-semibold`.  
- Corps de texte : 14–15 px, `font-normal`, couleur `#4B5563`.  
- Métadonnées / labels : 11–12 px, parfois `uppercase`, `tracking-wide` léger.

**Composants**

- **Header global** : une seule barre en haut de l’écran, avec logo RER à gauche et le nom de l’outil. Selon la page, cette barre peut afficher le **titre de page et ses actions principales** (ex. sur `/articles` : « Liste des articles » + bouton « Nouvel article ») pour éviter un double header.  
- **Cartes d’articles** : fond blanc, coins 16–20 px, ombre douce, image pleine hauteur à gauche (`object-cover`), badges Format + Rubrique en tête, métadonnées (auteur, mutuelle, date de publication) en bas.  
- **Boutons** : primaires orange `#F1663C` (texte blanc, arrondis, ombre légère) ; secondaires fond blanc + bordure `#E5E7EB`, texte gris/bleu, survol gris très clair.  
  - Les liens texte génériques du site peuvent être stylés en bleu RER (`a:not([class]) { color: #243B8F; }`), **mais les boutons doivent conserver leur texte blanc sur fond orange** (ne pas leur appliquer la couleur des liens globaux).  
- **Champs de recherche / filtres** : fond blanc, bordure `#D1D5DB`, coins 8 px, focus `border-color: #111827` + ombre légère.  
- **Barre de recherche / filtres articles** : carte blanche pleine largeur (coins 12–16 px, légère ombre, bordure `#E5E7EB`) qui contient le champ de recherche, le compteur d’articles et les actions de filtres.  
  - **Filtres avancés** (mutuelles, rubriques, formats, dates) repliables dans un sous-bloc plus discret (fond légèrement grisé, bordure fine) pour ne pas prendre trop de hauteur par défaut, surtout sur mobile.  
- **Fiche article** : même charte que la vue Explorer, sous forme de grande carte blanche : badges Format/Rubrique et État en tête, titre fort, métadonnées auteur/mutuelle/date, image éventuelle en haut, chapô en gras, contenu en texte courant, bloc « Post réseaux sociaux » encadré en bas.  

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
| [docs/utilisation.md](utilisation.md) | Guide utilisateur : connexion, navigation (Articles, Mes articles, Relecteurs), vues Cartes / Explorer / Tableau, filtres et dates, dépôt (saisie + import Word), relecture (corriger, états, historique), copies HTML/texte et exports. |
| [docs/deploiement.md](deploiement.md) | Déploiement (Vercel, Supabase, OVH), variables d’env, checklist. |
| [docs/plan.md](plan.md) | Plan du projet, analyse BDD, sprints. |
