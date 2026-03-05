---
name: ""
overview: ""
todos: []
isProject: false
---

# UX en-tête liste articles

## Objectif

Améliorer l’UX du haut de la page `/articles` : reset unique, placement du bouton dépôt, filtre date, indicateur dernière publication, **correction de la multi-sélection des facettes**, et **bouton flottant « Ajouter un article »** (FAB) sur mobile.

---

## 1. Réinitialisation des filtres (un seul point d’entrée)

- Un seul bouton global : **« Réinitialiser tous les filtres »** (remet à zéro : recherche texte, facettes, filtre date).
- Supprimer toute autre action de reset partiel qui prête à confusion (ex. ne pas avoir deux CTA distincts « effacer la recherche » et « tout effacer »).
- Copie explicite pour le bouton unique.

**Fichiers :** [app/articles/ArticlesFiltersBar.tsx](app/articles/ArticlesFiltersBar.tsx)

---

## 2. Bouton « Déposer un article » : header + FAB mobile

- **Header** : garder un bouton principal « Déposer un article » dans l’en-tête de la page (à droite des boutons Cartes / Explorer / Tableau), hors de la barre de filtres.
- **Bouton flottant (FAB)** : sur **mobile / petits écrans** uniquement, afficher un bouton flottant en bas à droite (icône +, label court type « Nouvel article »), lien vers `/articles/depot`. Masquer ce FAB sur desktop (lg:) pour ne pas doubler avec le bouton du header.
- Implémentation : déplacer le lien actuel de `ArticlesFiltersBar` vers le header dans [app/articles/page.tsx](app/articles/page.tsx) ; ajouter un composant client ou un bloc conditionnel pour le FAB (visible en `lg:hidden` ou via media query).

**Fichiers :** [app/articles/page.tsx](app/articles/page.tsx), éventuellement petit composant `FloatingAddArticle.tsx` ou bloc dans le layout de la page.

---

## 3. Multi-sélection des facettes (correction)

**Problème actuel :** quand on sélectionne une facette (ex. une mutuelle), les autres options de la même catégorie disparaissent, car l’API `/api/articles/facets` applique tous les filtres (y compris les facettes) au `where` du `groupBy`. Seules les valeurs présentes dans le résultat filtré sont renvoyées.

**Correction :**

- **Backend** [app/api/articles/facets/route.ts](app/api/articles/facets/route.ts) : pour chaque catégorie (mutuelles, rubriques, formats), calculer les facettes avec un `where` qui **exclut le filtre de cette catégorie** (mais garde `q`, date, et les autres catégories). Ainsi, pour « Mutuelles », on fait un `groupBy` sur `mutuelleId` avec un `where` qui contient seulement `q`, rubriqueId, formatId, date ; pour « Rubriques », idem sans rubriqueId ; etc. Les comptes restent cohérents avec les autres filtres, et toutes les options (y compris déjà sélectionnées) restent visibles.
- **Frontend** [app/articles/ArticlesFiltersBar.tsx](app/articles/ArticlesFiltersBar.tsx) : s’assurer que les facettes sélectionnées restent affichées avec état actif (style « selected ») et que les autres restent cliquables pour ajouter/retirer. Aucun changement majeur de state si le backend renvoie déjà toutes les options.

**Résumé :** trois requêtes `groupBy` distinctes, chacune avec un `where` qui omet la dimension concernée, pour afficher en permanence toutes les facettes de chaque catégorie avec des comptes corrects.

---

## 4. Filtre de date

- **UI** dans `ArticlesFiltersBar` : bloc « Dates » avec presets **Depuis 1 mois**, **Depuis 3 mois**, **Depuis 6 mois**, et **Période personnalisée** (deux `input type="date"` : du / au).
- **URL :** `since` (ISO date) pour les presets ; `from` et `to` pour la période personnalisée (si présents, ignorer `since`).
- **Backend :** [app/articles/page.tsx](app/articles/page.tsx), [app/api/articles/route.ts](app/api/articles/route.ts), [app/api/articles/facets/route.ts](app/api/articles/facets/route.ts) — ajouter à `where` la condition sur `createdAt` (gte/lte selon `since` ou `from`/`to`).
- Le bouton « Réinitialiser tous les filtres » efface aussi `since`, `from`, `to`.

---

## 5. Indicateur date du dernier article publié

- Dans [app/articles/page.tsx](app/articles/page.tsx) : requête `prisma.article.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } })`, passer la date en prop à `ArticlesFiltersBar` (ex. `lastCreatedAt`).
- Dans `ArticlesFiltersBar` : afficher à côté du compteur « X articles trouvés » une mention du type « Dernier article publié le JJ/MM/AAAA » (format `fr-FR`), discrète.

---

## 6. Harmonisation des libellés

- « Réinitialiser tous les filtres » pour le bouton unique.
- « Recherche texte » pour le champ.
- « X article(s) trouvé(s) » déjà géré.
- Dates : « Depuis 1 mois », « Depuis 3 mois », « Depuis 6 mois », « Période personnalisée ».

---

## Ordre d’implémentation suggéré

1. **reset-ux-unifie** : Un seul bouton « Réinitialiser tous les filtres » ; déplacer « Déposer un article » dans le header.
2. **facettes-multi-select** : Adapter `/api/articles/facets` (where par catégorie) + vérifier l’affichage dans `ArticlesFiltersBar`.
3. **date-filter** : Backend (page + API + facets) puis front (presets + personnalisée + reset).
4. **last-published** : Requête + prop + affichage dans la barre.
5. **fab-mobile** : Bouton flottant « Nouvel article » visible uniquement sur mobile, lien `/articles/depot`.

---

## Todos

- **reset-ux-unifie** : Unifier la réinitialisation des filtres (un seul bouton) et déplacer « Déposer un article » dans le header.
- **facettes-multi-select** : Corriger l’API facets (where sans la dimension groupBy) pour que toutes les facettes restent visibles en multi-sélection.
- **date-filter-backend** : Ajouter paramètres `since` / `from` / `to` et filtre `createdAt` dans page, `/api/articles`, `/api/articles/facets`.
- **date-filter-frontend** : UI filtre date (presets + période personnalisée) dans `ArticlesFiltersBar` + reset global.
- **last-published-indicator** : Afficher la date du dernier article publié dans la barre de filtres.
- **fab-mobile** : Bouton flottant « Nouvel article » (FAB) sur mobile uniquement, lien vers `/articles/depot`.

