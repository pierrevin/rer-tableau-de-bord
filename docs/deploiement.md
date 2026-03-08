# Déploiement – RER Tableau de bord V2

Ce document décrit comment déployer l’application en production. Les corrections UX de l’éditeur de dépôt pourront être faites plus tard.

---

## 1. Prérequis

- **Base de données** : PostgreSQL (Supabase déjà utilisé en dev).
- **Variables d’environnement** à définir en production :
  - `DATABASE_URL` : URL de connexion PostgreSQL (Supabase ou autre).
  - `NEXTAUTH_SECRET` : secret pour les sessions (générer une valeur longue et aléatoire).
  - `NEXTAUTH_URL` : URL publique de l’app (ex. `https://votre-app.vercel.app`).
  - `MAIL_PROVIDER` : provider d’envoi (`auto`, `webhook`, `resend`, `noop`, `smtp` réservé).
  - `MAIL_WEBHOOK_URL` : endpoint HTTP d’envoi d’e-mails (si provider `webhook`).
  - `MAIL_FROM` : expéditeur (obligatoire pour Resend).
  - `RESEND_API_KEY` : clé API Resend (si provider `resend`).
  - `PASSWORD_RESET_WEBHOOK_URL` : variable legacy encore supportée (fallback si `MAIL_WEBHOOK_URL` absent).

Génération d’un `NEXTAUTH_SECRET` :
```bash
openssl rand -base64 32
```

---

## 2. Option A : Vercel (recommandé pour Next.js)

1. **Compte** : [vercel.com](https://vercel.com), connexion avec GitHub.
2. **Import** : New Project → importer le repo `pierrevin/rer-tableau-de-bord` (ou le repo utilisé).
3. **Build** :
   - Framework Preset : Next.js.
   - Build Command : `npm run build`. Si Prisma n’est pas appelé automatiquement, utiliser `npx prisma generate && npm run build`, ou ajouter dans `package.json` un script `"postinstall": "prisma generate"`.
   - Output : laisser par défaut.
4. **Variables d’environnement** (Settings → Environment Variables) :
   - `DATABASE_URL` (Production, Preview, Development).
   - `NEXTAUTH_SECRET` (Production, Preview).
   - `NEXTAUTH_URL` = `https://votre-projet.vercel.app` (ajuster après le premier déploiement).
5. **Migrations** : Vercel ne lance pas les migrations automatiquement. Soit :
   - exécuter en local avant chaque déploiement : `npm run db:migrate` (avec `DATABASE_URL` de prod),  
   - soit ajouter un script de déploiement ou un job qui appelle `prisma migrate deploy` (ex. GitHub Action).
6. **Déployer** : push sur la branche connectée (ex. `main`) déclenche un déploiement.

**Note** : les fichiers uploadés dans `public/uploads` ne sont pas persistés sur Vercel (filesystem éphémère). Pour la prod, il faudra passer par un stockage externe (Supabase Storage, S3, etc.) et adapter `POST /api/upload`.

---

## 3. Option B : Supabase (Hosting + BDD)

- **BDD** : déjà sur Supabase.
- **Hosting** : Supabase propose du hosting (Edge Functions, etc.). Pour une app Next.js complète, on peut :
  - déployer Next.js sur **Vercel** ou **Netlify** et garder Supabase pour PostgreSQL + Auth/Storage,  
  - ou déployer Next.js en **Node** sur un service qui supporte Node (Railway, Render, OVH Web Paas, etc.) et pointer `DATABASE_URL` vers Supabase.

Donc en pratique : BDD Supabase + hébergement Next.js sur Vercel/Railway/Render/OVH.

---

## 4. Option C : OVH (VPS ou Web Paas)

- **VPS** :
  1. Machine Linux (ex. Ubuntu).
  2. Installer Node (LTS), npm, éventuellement PM2.
  3. Cloner le repo, `npm install`, `npx prisma generate`, `npx prisma migrate deploy`.
  4. Configurer les variables d’environnement (fichier ou système).
  5. Build : `npm run build` puis `npm run start` (port 3000) ou utiliser PM2.
  6. Nginx (ou autre) en reverse proxy vers le port de l’app, SSL (Let’s Encrypt).

- **Web Paas** : suivre la doc OVH pour une app Node/Next.js (build + start, variables d’env, migrations à lancer manuellement ou via script).

---

## 5. Checklist avant mise en production

- [ ] `DATABASE_URL` pointe vers la BDD de prod (Supabase ou autre).
- [ ] `NEXTAUTH_URL` = URL réelle de l’app (sans slash final).
- [ ] `NEXTAUTH_SECRET` défini et gardé secret.
- [ ] Migrations appliquées : `npx prisma migrate deploy`.
- [ ] Seed si besoin (référentiels, premier admin) : `npm run db:seed`.
- [ ] Uploads : prévoir un stockage persistant (Supabase Storage ou S3) et adapter l’API d’upload si nécessaire.

---

## 6. Après déploiement

- Tester : connexion, liste articles, détail, dépôt (si l’éditeur est utilisable), déconnexion.
- Documenter l’URL de prod et les comptes de test dans `docs/SUIVI.md` (Sprint 5).
- Les erreurs UX de l’éditeur de dépôt seront corrigées dans une prochaine itération.
