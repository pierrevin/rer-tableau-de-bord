# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

RER Tableau de bord V2 — a single Next.js 14 (App Router) CMS for managing editorial articles for a federation of mutuelles. Uses Prisma + PostgreSQL, NextAuth (credentials), Tiptap rich-text editor, and optional Supabase Storage for images.

### Services

| Service | How to start | Notes |
|---------|-------------|-------|
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | Must be running before the app |
| Next.js dev | `npm run dev` | Serves both frontend and API on port 3000 |

### Database setup (first time)

The initial migration (`20240221000000_init`) is a no-op; for fresh databases use `npx prisma db push` instead of `npx prisma migrate deploy`. After that, run `npx tsx scripts/create-test-users.ts` to create test accounts (admin/relecteur/auteur with password `rer2025`). Reference data (Etats, Rubriques, Formats, Mutuelles, Auteurs) must also be seeded — no seed file exists at `prisma/seed.ts`.

### Environment variables

Create `.env` at the repo root with at minimum:

```
DATABASE_URL="postgresql://rerdev:rerdev@localhost:5432/rer_dev"
NEXTAUTH_SECRET="dev-secret-for-local-testing-only"
NEXTAUTH_URL="http://localhost:3000"
```

Supabase variables are optional (image upload only).

### Lint / Build

- `npm run lint` — ESLint. Requires `.eslintrc.json` with `{"extends": "next/core-web-vitals"}` (not committed to repo).
- `npm run build` — currently fails due to pre-existing `react-hooks/rules-of-hooks` errors in `app/articles/depot/page.tsx` and `app/AppUserSwitchFooter.tsx`. The dev server works normally despite these.

### Test accounts

| Email | Role | Password |
|-------|------|----------|
| admin@rer.local | admin | rer2025 |
| relecteur@rer.local | relecteur | rer2025 |
| auteur@rer.local | auteur | rer2025 |
