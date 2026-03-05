# Mesure des performances (version alpha en ligne)

Ce document décrit comment mesurer les temps de chargement et identifier les requêtes ou pages lentes sur la version déployée (Vercel).

## Connection pooling Supabase (Vercel)

Pour limiter la latence et le nombre de connexions en production, utilisez l’URL de **connection pooling** Supabase comme `DATABASE_URL` sur Vercel :

- Dans le dashboard Supabase : **Project Settings → Database**.
- Récupérez l’URL **Connection pooling** (mode Transaction, port **6543**).
- Sur Vercel, définissez la variable d’environnement `DATABASE_URL` avec cette URL et ajoutez `?pgbouncer=true` à la fin.
- Pour les migrations Prisma, exécutez-les en local avec l’URL directe (port 5432) ou configurez une variable `DIRECT_URL` et ajoutez `directUrl = env("DIRECT_URL")` dans `prisma/schema.prisma` si besoin.

## Dans le navigateur (DevTools)

1. **Ouvrir la version alpha en ligne** et se connecter.
2. **Ouvrir les DevTools** (F12 ou Cmd+Option+I), onglet **Network**.
3. **Recharger la page** (ou naviguer vers une page lente) et observer :
   - **TTFB** (Time To First Byte) et colonne **Waiting (TTFB)** pour les requêtes de type `document`, `fetch` ou `XHR`.
   - Repérer les requêtes qui dépassent 300–500 ms.
4. **Onglet Performance** :
   - Cliquer sur **Record**, effectuer un chargement initial puis une navigation entre 2–3 pages clés, arrêter l’enregistrement.
   - Analyser les long tasks (barres rouges) et le temps jusqu’au First Contentful Paint (FCP) / Largest Contentful Paint (LCP).

## Ce qu’il faut noter

- Si la lenteur vient surtout des **requêtes réseau** (TTFB élevé sur des URLs `/api/...` ou la page document) → optimiser le backend (Prisma, cache, région).
- Si la lenteur vient du **rendu** (long tasks, FCP/LCP tardifs) → optimiser le front (code splitting, loading UI, composants lourds).

## Après chaque optimisation

Rejouer les mêmes scénarios (chargement initial, navigation, actions sur boutons) et comparer les temps pour valider l’amélioration.

## Web Vitals et suivi continu

- Dans le dashboard **Vercel** : onglet **Analytics** ou **Speed Insights** pour consulter les métriques (LCP, FID, CLS, TTFB) sur les pages en production.
- Tester manuellement avant/après chaque déploiement : chronométrer le chargement de la page Articles, de Mes articles et d’une action (changement d’état, sauvegarde) pour garder une baseline et détecter les régressions.
