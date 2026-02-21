# Suivi du projet – Plateforme RER Tableau de bord V2

Fichier mis à jour à chaque fin d’étape ou de sprint. Objectif : tracer l’avancement, les tests en serveur local, les points bloquants et les décisions.

---

## Choix et décisions

| Date       | Décision / point bloquant | Note |
| ---------- | ------------------------- | ----- |
| _(à remplir)_ | | |

---

## Phase 1 – Sprints

### Sprint 1 – BDD, seed, import

| Étape | Statut | Test local | Date |
| ----- | ------ | ---------- | ---- |
| Initialisation projet (Next.js, deps, .env) | À faire | — | |
| Schéma BDD (tables, migrations) | À faire | — | |
| Seed référentiels (états, rubriques, formats, mutuelles) | À faire | — | |
| Script d’import xlsx + rapport | À faire | — | |
| **Critère de fin** : données migrées consultables (page ou CLI) | — | BDD OK, seed + import OK | |

**Résultat test serveur local (fin Sprint 1) :**  
_(à remplir après `npm run dev` et vérifications)_

---

### Sprint 2 – Auth et rôles

| Étape | Statut | Test local | Date |
| ----- | ------ | ---------- | ---- |
| Auth (inscription, connexion) | À faire | — | |
| Rôles (Admin, Relecteur, Auteur, Lecteur) | À faire | — | |
| Middleware / gardes par rôle | À faire | — | |
| Association user ↔ auteur | À faire | — | |
| **Critère de fin** : connexion par rôle, accès différencié | — | Connexion chaque rôle, droits OK | |

**Résultat test serveur local (fin Sprint 2) :**  
_(à remplir)_

---

### Sprint 3 – Liste, détail, dépôt, photo

| Étape | Statut | Test local | Date |
| ----- | ------ | ---------- | ---- |
| Liste articles (filtres, recherche, pagination) | À faire | — | |
| Détail article (affichage, drawer/panneau) | À faire | — | |
| Upload photo (stockage interne) | À faire | — | |
| Formulaire dépôt (saisie directe) | À faire | — | |
| **Critère de fin** : navigation lecture + dépôt avec photo | — | Parcourir liste, ouvrir article, déposer avec photo | |

**Résultat test serveur local (fin Sprint 3) :**  
_(à remplir)_

---

### Sprint 4 – Import Word, relecture, exports

| Étape | Statut | Test local | Date |
| ----- | ------ | ---------- | ---- |
| Import Word (.docx → pré-remplissage) | À faire | — | |
| Relecture (édition, workflow états, historique) | À faire | — | |
| Exports (Word, HTML, Texte) | À faire | — | |
| **Critère de fin** : cycle dépôt → relecture → export | — | Import .docx, corriger, changer état, télécharger export | |

**Résultat test serveur local (fin Sprint 4) :**  
_(à remplir)_

---

### Sprint 5 – UI/UX, déploiement, doc

| Étape | Statut | Test local | Date |
| ----- | ------ | ---------- | ---- |
| Charte, responsive, accessibilité, messages | À faire | — | |
| Déploiement (OVH ou Supabase) | À faire | — | |
| Comptes de test (auteur, relecteur, admin) | À faire | — | |
| Documentation utilisateur et technique | À faire | — | |
| **Critère de fin** : Phase 1 livrée et déployée | — | Vérification finale `npm run dev` puis prod | |

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
