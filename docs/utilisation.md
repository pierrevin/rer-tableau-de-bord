# Utilisation – RER Tableau de bord V2

Guide utilisateur pour la base de données d’articles (dépôt, relecture, consultation). À tester en local avec `npm run dev` puis http://localhost:3000.

---

## 1. Connexion

- **URL** : `/login`
- **Comptes de test** (créés par `npm run db:seed`) :
  - **Admin** : admin@rer.local / `rer2025`
  - **Relecteur** : relecteur@rer.local / `rer2025`
  - **Auteur** : auteur@rer.local / `rer2025`

Seuls les utilisateurs connectés peuvent accéder au tableau de bord et aux actions selon leur rôle : toute tentative d’accès direct à une page de l’application redirige automatiquement vers `/login` tant que l’utilisateur n’est pas authentifié.

---

## 2. Navigation et pages principales

- **Page d’accueil (`/`)**  
  - Si l’utilisateur est **Relecteur** ou **Admin** : redirection automatique vers la file de relecture `/admin/articles?etat=a_relire`.  
  - Sinon (Auteur, Lecteur ou non connecté) : redirection vers la page Articles `/articles` en vue Explorer.

- **Menu principal (header)**  
  En haut à droite du site, un menu permet d’accéder aux sections suivantes :
  - **Articles** : liste complète des articles (`/articles`), avec plusieurs vues (Explorer, Cartes, Tableau).  
  - **Mes articles** : accès rapide aux articles déposés par l’utilisateur connecté (`/mes-articles`, redirigé pour l’instant vers `/articles?mine=1`).  
  - **Relecteurs** : entrée dédiée aux relecteurs/admin (`/relecteurs`, qui renvoie aujourd’hui vers la vue Explorer avec des paramètres spécifiques).

- **Fiche article** : `/articles/[id]`  
  Affichage du titre, auteur, mutuelle, rubrique, format, date de publication (`datePublication ?? dateDepot ?? createdAt`), état (pour les profils autorisés), chapô, contenu, image (si présente), post RS, lien Google Doc.  
  **Relecteur / Admin** : bouton **« Corriger »** pour passer en mode édition.

### 2.1. Vue Articles – Explorer / Cartes / Tableau

Sur `/articles`, trois modes d’affichage sont disponibles :

- **Explorer (par défaut)** :  
  - Colonne gauche : liste compacte de cartes (image à gauche, titre, chapô, badges Format/Rubrique, auteur, mutuelle, date de publication).  
  - Colonne droite : panneau de prévisualisation avec le texte complet, le chapô mis en gras, la photo et le post réseaux sociaux.  
  - Sur mobile, la prévisualisation s’ouvre dans un **drawer** (panneau qui remonte depuis le bas).  
  - Raccourcis clavier : flèches haut/bas pour naviguer, Entrée pour ouvrir, Ctrl/⌘+E pour certaines actions.

- **Cartes** :  
  - Grille de cartes avec image pleine hauteur à gauche, titre et chapô à droite, métadonnées auteur / mutuelle / **Publié le** en bas.  
  - Adaptée à une exploration plus visuelle.

- **Tableau** :  
  - Tableau avec colonnes : Photo, Titre, Auteur, Mutuelle, Rubrique, Format, **Publié le**, État, Actions (voir / corriger).  
  - Utile pour les vues de synthèse et le travail de relecture.

### 2.2. Barre de recherche et filtres

En haut de la page `/articles`, une **barre de filtres** commune aux trois vues permet :

- **Recherche texte** (titre, chapô, contenu) avec déclenchement progressif (debounce).  
- **Suggestions dynamiques** : quand on tape, les mutuelles, rubriques et formats correspondants sont proposés sous forme de suggestions ; un clic sur une suggestion active le filtre correspondant.  
- **Facettes multi-sélection** :  
  - Mutuelles, Rubriques, Formats avec compteurs, présentées sous forme de pastilles cliquables.  
  - Possibilité de sélectionner plusieurs valeurs dans chaque catégorie.  
  - Les facettes actives apparaissent aussi dans une ligne dédiée avec une croix pour les retirer rapidement.
- **Filtres de dates** :  
  - Boutons rapides **« Depuis 1 mois »**, **« Depuis 3 mois »**, **« Depuis 6 mois »**.  
  - Période personnalisée (date de début / date de fin).  
  - Le filtrage utilise `datePublication` si elle est renseignée, sinon `createdAt`.
- **Réinitialisation** : un lien **« Réinitialiser tous les filtres »** permet de revenir à un état neutre.

### 2.3. Date affichée dans les listes

Dans toutes les vues de liste (Explorer, Cartes, Tableau) et sur la fiche article, la date affichée est :

- Toujours sous la forme **« Publié le JJ/MM/AAAA »**.  
- Calculée avec la règle : `datePublication ?? dateDepot ?? createdAt`, ce qui permet :
  - D’utiliser `dateDepot` comme date de référence pour les articles importés historiques.  
  - D’utiliser `datePublication` pour les articles validés via le workflow de relecture.  
  - De retomber sur `createdAt` si aucune des autres n’est disponible.

---

## 3. Mes articles

- **URL** : `/mes-articles` (via le menu en haut à droite).  
- **Comportement actuel** : redirige vers `/articles?mine=1`.  
- **Objectif** : afficher uniquement les articles dont l’utilisateur connecté est l’auteur (liste filtrée), avec la même ergonomie que la page Articles (vues Explorer / Cartes / Tableau, filtres, etc.).  
  Le filtrage précis `mine=1` sera pleinement opérationnel une fois la gestion des comptes et des permissions finalisée.

---

## 4. Nouvel article – éditeur riche

- **URL** : `/articles/depot`
- **Accès** : tout utilisateur connecté (en pratique surtout auteurs).

**Deux possibilités :**

1. **Saisie directe avec éditeur riche**  
   - Remplir le formulaire : titre *, chapô, contenu *, auteur *, mutuelle, rubrique, format, légende photo, post RS.  
   - Le contenu principal se fait désormais dans un **éditeur riche type Medium/Gutenberg** :  
     - Paragraphes, titres `H2` / `H3`, listes à puces, citations, liens.  
     - Barre d’outils contextuelle et boutons en haut de l’éditeur (B, I, H2, H3, Liste, Citation).  
   - Le compteur de signes s’affiche si un format avec « signes de référence » est choisi (calcul effectué à partir du texte saisi dans l’éditeur).

2. **Importer un Word**  
   - Cliquer sur **« Importer un Word »**  
   - Choisir un fichier `.docx` (max 10 Mo)  
   - Le titre, le chapô et le contenu sont pré-remplis à partir du document (1er paragraphe court = titre, 2e = chapô, reste = contenu).  
   - Ajuster si besoin puis compléter auteur et autres champs avant de déposer.

L’article est créé avec l’état **« À relire »**. Le contenu est stocké à la fois en **HTML** (pour les exports et la consultation) et en **JSON structuré** (pour l’éditeur riche et les évolutions futures).

---

## 5. Relecture et correction (éditeur riche)

Réservé aux rôles **Relecteur** et **Admin**.

- Depuis la **fiche article** : cliquer sur **« Corriger »** → redirection vers la page d’édition.
- Depuis le menu **Relecteurs** (`/relecteurs`) : accès à une vue Explorer dédiée (mêmes composants que `/articles`, mais appelée à être spécialisée pour les workflows de relecture).

- **Page d’édition auteur** : `/articles/[id]/edit`  
  - Modifier : titre, chapô, contenu (via le même **éditeur riche** que sur le dépôt), mutuelle, rubrique, format, légende photo, post RS.  
  - **Changer l’état** : À relire → Corrigé → Validé → Publié (sélecteur d’état, selon rôle).  
  - **Historique** : en bas de page, liste des changements d’état (qui a changé, quand, vers quel état).

- **Espace relecteurs / admin** : `/admin/articles`  
  - Colonne de gauche : file d’articles filtrable par **état** (Tous, À relire, Corrigé, Validé, Publié) avec badge d’état compact, mutuelle, rubrique, format et âge de l’article.  
  - Colonne de droite : panneau de relecture avec :  
    - Titre multi-ligne directement éditable.  
    - Sélecteur d’auteur (liste d’auteurs/mutuelles) modifiable.  
    - Timeline d’états (À relire, Corrigé, Validé, Publié) cliquable pour changer l’état.  
    - Contenu intégral dans le **même éditeur riche** que le dépôt, avec bouton Chapô pour mettre en avant le premier paragraphe.  
    - Bloc « Post réseaux sociaux » dédié, prêt à être copié/collé.  
    - Historique des changements d’état regroupé en bas du panneau.

À chaque changement d’état, une entrée est enregistrée dans l’historique (traçabilité). Les modifications de contenu effectuées par les relecteurs sont sauvegardées dans le même modèle (HTML + JSON), ce qui permet de conserver un historique fiable et de futures évolutions (comparaison avant/après).

---

## 6. Copies et exports (Word / HTML / Texte)

Deux modes principaux de récupération du contenu sont disponibles :

1. **Depuis la vue Explorer** (`/articles`, colonne de droite) :  
   - **Copier HTML** : met dans le presse-papiers un HTML propre (titre, chapô, paragraphes, post RS) prêt à coller dans un CMS ou un éditeur riche.  
   - **Copier texte** : met dans le presse-papiers un texte simple structuré (sans syntaxe Markdown), compatible avec un collage direct dans Google Docs ou Word.  
   - Bouton **« Exporter Word »** : ouvre un téléchargement au format Word-compatible incluant le texte de l’article.

2. **Depuis la fiche article** (`/articles/[id]`) :  
   - Boutons d’export **TXT**, **HTML** et **Word** restent disponibles :  
     - **TXT** : export texte brut (`.txt`) avec titre, métadonnées, chapô, contenu, post RS.  
     - **HTML** : page HTML simple (`.html`) avec structure de titres et paragraphes.  
     - **Word** : fichier `.doc` (HTML servi avec un type `application/msword`) ouvrable directement dans Microsoft Word ou LibreOffice.  
   - Les fichiers sont téléchargés via l’URL :  
     `/api/articles/[id]/export?format=txt|html|word`.

---

## 7. Commandes projet (rappel)

| Commande | Description |
| -------- | ----------- |
| `npm run dev` | Serveur de développement (localhost:3000) |
| `npm run build` | Build de production |
| `npm run db:generate` | Générer le client Prisma |
| `npm run db:migrate` | Appliquer les migrations |
| `npm run db:seed` | Alimenter les référentiels + comptes de test |
| `npm run import:xlsx` | Importer les données depuis le fichier xlsx (voir doc technique) |

---

## 8. À venir (non encore implémenté)

- **Notifications** : email (accusé dépôt, article relu / publié).
- Améliorations UX de l’éditeur de dépôt (à retravailler plus tard).

Pour l’état détaillé des sprints et des tests, voir [SUIVI.md](SUIVI.md).
