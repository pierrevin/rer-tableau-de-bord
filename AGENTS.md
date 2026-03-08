# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

RER Tableau de bord V2 — single Next.js 16 (App Router, Turbopack) CMS for managing editorial articles for a federation of mutuelles. Stack: React 19, Prisma 6 + PostgreSQL, NextAuth v4, Tiptap rich-text editor, Tailwind CSS, Vitest, ESLint 9 flat config.

### Services

| Service | How to start | Notes |
|---------|-------------|-------|
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | Must be running before the app |
| Next.js dev | `npm run dev` | Turbopack, port 3000 by default |

### Commands

| Task | Command | Notes |
|------|---------|-------|
| Lint | `npm run lint` | ESLint 9 flat config (`eslint.config.mjs`); 5 pre-existing errors in app code |
| Test | `npm run test` | Vitest (`vitest run`) |
| Build | `npm run build` | `prisma generate && next build` (Turbopack) |
| Audit | `npm run audit` | `npm audit --audit-level=moderate`; known vulns in `bcrypt`/`tar` and `xlsx` |
| Dev | `npm run dev` | `next dev` |

### Key upgrade notes (Next 14→16, React 18→19)

- `middleware.ts` → `proxy.ts`, exported function `middleware()` → `proxy()`.
- Dynamic route params are now `Promise<>` (must `await params` in route handlers and pages).
- `next lint` CLI removed; lint script uses `eslint .` directly.
- React Compiler rules (`set-state-in-effect`, `preserve-manual-memoization`) downgraded to warnings in `eslint.config.mjs` because pre-existing code patterns trigger them.
- `tsconfig.json` auto-updated by Next.js 16: `jsx: "react-jsx"`, added `.next/dev/types/**/*.ts` in include.

### Database setup (first time)

The initial migration (`20240221000000_init`) is a no-op; for fresh databases use `npx prisma db push` instead of `npx prisma migrate deploy`. After that, run `npx tsx scripts/create-test-users.ts` to create test accounts. Reference data (Etats, Rubriques, Formats, Mutuelles, Auteurs) must also be seeded — no seed file exists at `prisma/seed.ts`.

### Environment variables

Create `.env` at the repo root with at minimum:

```
DATABASE_URL="postgresql://rerdev:rerdev@localhost:5432/rer_dev"
NEXTAUTH_SECRET="dev-secret-for-local-testing-only"
NEXTAUTH_URL="http://localhost:3000"
```

Supabase variables are optional (image upload only).

### Test accounts

| Email | Role | Password |
|-------|------|----------|
| admin@rer.local | admin | rer2025 |
| relecteur@rer.local | relecteur | rer2025 |
| auteur@rer.local | auteur | rer2025 |
