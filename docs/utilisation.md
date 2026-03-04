# Utilisation – RER Tableau de bord V2

Guide utilisateur pour la base de données d’articles (dépôt, relecture, consultation). À tester en local avec `npm run dev` puis http://localhost:3000.

---

## 1. Connexion

- **URL** : `/login`
- **Comptes de test** (créés par `npm run db:seed`) :
  - **Admin** : admin@rer.local / `rer2025`
  - **Relecteur** : relecteur@rer.local / `rer2025`
  - **Auteur** : auteur@rer.local / `rer2025`

Seuls les utilisateurs connectés peuvent accéder au tableau de bord et aux actions selon leur rôle.

---

## 2. Explorer la base

- **Liste des articles** : `/articles`  
  Filtres (recherche, période, rubrique, format, auteur, état, mutuelle, post RS), tri, pagination.  
  Cliquer sur un article pour ouvrir sa fiche.

- **Fiche article** : `/articles/[id]`  
  Affichage du titre, auteur, métadonnées, état, chapô, contenu, image (si présente), post RS, lien Google Doc.  
  **Relecteur / Admin** : bouton **« Corriger »** pour passer en mode édition.

---

## 3. Déposer un article

- **URL** : `/articles/depot`
- **Accès** : tout utilisateur connecté (en pratique surtout auteurs).

**Deux possibilités :**

1. **Saisie directe**  
   Remplir le formulaire : titre *, chapô, contenu *, auteur *, mutuelle, rubrique, format, légende photo, post RS.  
   Le compteur de signes s’affiche si un format avec « signes de référence » est choisi.

2. **Importer un Word**  
   - Cliquer sur **« Importer un Word »**  
   - Choisir un fichier `.docx` (max 10 Mo)  
   - Le titre, le chapô et le contenu sont pré-remplis à partir du document (1er paragraphe court = titre, 2e = chapô, reste = contenu).  
   - Ajuster si besoin puis compléter auteur et autres champs avant de déposer.

L’article est créé avec l’état **« À relire »**.

---

## 4. Relecture et correction

Réservé aux rôles **Relecteur** et **Admin**.

- Depuis la **fiche article** : cliquer sur **« Corriger »** → redirection vers la page d’édition.

- **Page d’édition** : `/articles/[id]/edit`  
  - Modifier : titre, chapô, contenu, mutuelle, rubrique, format, légende photo, post RS.  
  - **Changer l’état** : À relire → Corrigé → Validé → Publié (sélecteur d’état).  
  - **Historique** : en bas de page, liste des changements d’état (qui a changé, quand, vers quel état).

À chaque changement d’état, une entrée est enregistrée dans l’historique (traçabilité).

---

## 5. Exports (Word / HTML / Texte)

Depuis la **fiche article** (`/articles/[id]`), trois boutons d’export sont disponibles :

- **TXT** : export texte brut (`.txt`) avec titre, métadonnées, chapô, contenu, post RS.
- **HTML** : page HTML simple (`.html`) avec structure de titres et paragraphes.
- **Word** : fichier `.doc` (HTML servi avec un type `application/msword`) ouvrable directement dans Microsoft Word ou LibreOffice.

Les fichiers sont téléchargés via l’URL :  
`/api/articles/[id]/export?format=txt|html|word`.

---

## 6. Commandes projet (rappel)

| Commande | Description |
| -------- | ----------- |
| `npm run dev` | Serveur de développement (localhost:3000) |
| `npm run build` | Build de production |
| `npm run db:generate` | Générer le client Prisma |
| `npm run db:migrate` | Appliquer les migrations |
| `npm run db:seed` | Alimenter les référentiels + comptes de test |
| `npm run import:xlsx` | Importer les données depuis le fichier xlsx (voir doc technique) |

---

## 7. À venir (non encore implémenté)

- **Notifications** : email (accusé dépôt, article relu / publié).
- Améliorations UX de l’éditeur de dépôt (à retravailler plus tard).

Pour l’état détaillé des sprints et des tests, voir [SUIVI.md](SUIVI.md).
