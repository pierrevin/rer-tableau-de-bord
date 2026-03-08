# AGENTS.md

## Cursor Cloud specific instructions

### Service overview

This is a Next.js 14 (App Router) editorial content management platform ("RER Tableau de Bord") for French mutual insurance companies. Single-service monolith: one Next.js app with API routes, Prisma ORM, PostgreSQL database.

### Starting services

1. **PostgreSQL**: `sudo pg_ctlcluster 16 main start`
2. **Dev server**: `npm run dev` (port 3000)

### Database setup (first time only)

The init migration (`20240221000000_init`) is empty — it was originally applied against an existing database. On a fresh database, use `npx prisma db push --force-reset` instead of `npx prisma migrate deploy` to create the schema from scratch.

After schema push, seed the Etat reference data:

```sql
PGPASSWORD=rer2025 psql -h localhost -U rer -d rer_dev -c "
INSERT INTO \"Etat\" (id, slug, libelle, ordre) VALUES
  ('etat_a_relire', 'a_relire', 'À relire', 1),
  ('etat_corrige', 'corrige', 'Corrigé', 2),
  ('etat_valide', 'valide', 'Validé', 3),
  ('etat_publie', 'publie', 'Publié', 4)
ON CONFLICT (slug) DO NOTHING;"
```

Create test users: `npx tsx scripts/create-test-users.ts`

Test credentials: `admin@rer.local` / `relecteur@rer.local` / `auteur@rer.local`, password: `rer2025`

### Standard commands

- **Lint**: `npm run lint`
- **TypeScript check**: `npx tsc --noEmit` (passes cleanly — use this to validate types without building)
- **Build**: `npm run build` (note: build fails due to pre-existing `react-hooks/rules-of-hooks` errors in `app/articles/depot/page.tsx` and `app/AppUserSwitchFooter.tsx`)
- **Dev server**: `npm run dev`
- **Prisma generate**: `npm run db:generate`

### Dependency management

The update script uses `npm ci` (not `npm install`) for deterministic, fast installs from `package-lock.json`. This avoids unnecessary lockfile diffs and is ~2x faster. After `npm ci`, `npx prisma generate` is required to regenerate the Prisma Client (which lives inside `node_modules`).

### Gotchas

- No `.env.example` or `prisma/seed.ts` exist in the repo despite `package.json` referencing `db:seed`. The seed script is missing.
- No ESLint config file ships with the repo; `next lint` will prompt interactively on first run. A `.eslintrc.json` with `{"extends": "next/core-web-vitals"}` must be created.
- `npm run build` fails due to pre-existing lint errors (React Hooks violations). The dev server (`npm run dev`) works fine regardless.
- Supabase Storage is optional — the app works without it, but image uploads for articles are disabled.
- The `.env` file requires `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
