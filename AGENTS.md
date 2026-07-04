# smartRT-API

Monorepo with `backend/` (AdonisJS 7) and `frontend/` (React 19 + Vite + TailwindCSS 4).

## Commands

Run **from each directory**. All paths are relative to that directory.

### Backend (`backend/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with HMR (`node ace serve --hmr`) |
| `npm run build` | Production build (`node ace build`) |
| `npm run test` | Run all test suites (Japa runner) |
| `node ace test` | Same as above |
| `npm run lint` | ESLint across the project |
| `npm run format` | Prettier --write |
| `npm run typecheck` | `tsc --noEmit` + tsc on inertia tsconfig |
| `node ace migration:run` | Run pending DB migrations |
| `node ace migration:rollback` | Rollback last batch |

Tests have three suites (configured in `adonisrc.ts:tests`):
- `tests/unit/` — timeout 2s
- `tests/functional/` — timeout 30s, starts HTTP server
- `tests/browser/` — timeout 300s, browser tests

To run a single test file: `node ace test --files tests/functional/auth.spec.ts`

### Frontend (`frontend/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server on `:5173` |
| `npm run build` | Vite production build |
| `npm run preview` | Preview production build |

## Architecture

- **Auth**: session-based (`@adonisjs/auth` with `sessionGuard`), **not JWT** (ignore `JWT_SECRET` in `.env` — it's unused)
- **Import aliases**: `#controllers/*`, `#models/*`, `#services/*`, `#middleware/*`, `#config/*`, `#start/*`, `#validators/*`, `#exceptions/*`, `#tests/*`, `#database/*` — all map to `./app/...` or their respective dirs
- **Role enum**: `admin | bendahara | warga` (column `users.role`)
- **User status enum**: `active | pending | suspended`
- **Verification status**: `pending | verified | rejected` (on `warga_profiles`)
- **Status huni**: `pemilik | penyewa` (on `warga_profiles`)
- **API prefix**: all routes under `/api`
- **Onboarding flow**: warga logs in → `requiresOnboarding: true` → POST `/api/warga/onboarding` → admin verifies
- **Frontend** is served by the backend via `@adonisjs/vite`. The frontend's `vite.config.js` builds into `backend/public/assets`. In dev, the frontend Vite dev server runs separately.

## Quirks

- **Node >=24** required (`engines` field in `backend/package.json`)
- **Google Sheets sync** is non-critical: all errors are caught silently (`console.error` only, request continues)
- **Password hashing** is automatic via `@beforeSave()` hook on the `User` model — never hash passwords manually
- **NIK/KK validation**: exactly 16 digits, always `.toString().trim()` before use
- **TypeScript 6** + `@adonisjs/tsconfig` — two tsconfig projects: root `tsconfig.json` and `tsconfig.inertia.json` (for Inertia page type inference)
- **Editorconfig** at `backend/.editorconfig`
- **Prettier** config from `@adonisjs/prettier-config`
- **ESLint** config from `@adonisjs/eslint-config`
- **Lint order**: lint → typecheck → test

## Sensitive files

- `.env` files (both `backend/` and `frontend/`) — never commit
- `backend/config/google-service-account.json` — never commit (gitignored)
- `backend/.adonisjs/` — generated, gitignored
- `backend/tmp/` — build artifacts, gitignored
