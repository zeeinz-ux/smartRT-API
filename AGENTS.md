# smartRT-API

Monorepo with `backend/` (AdonisJS 7) and `frontend/` (React 19 + Vite + TailwindCSS 4).

## Commands

Run **from each directory**. Paths relative to that directory.

### Backend (`backend/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR via `hot-hook` (watching `app/controllers/**` + `app/middleware/*`) |
| `npm run build` | Production build via `node ace build` |
| `npm run test` / `node ace test` | Run all test suites (Japa runner) |
| `node ace test --files tests/functional/auth.spec.ts` | Run a single test file |
| `npm run lint` | ESLint |
| `npm run format` | Prettier --write |
| `npm run typecheck` | `tsc --noEmit` (root) + `tsc --noEmit --project inertia/tsconfig.json` |
| `node ace migration:run` | Run pending DB migrations |
| `node ace migration:rollback` | Rollback last batch |

Test suites (defined in `adonisrc.ts:tests`):
- `tests/unit/` — timeout 2s
- `tests/functional/` — timeout 30s, starts HTTP server
- `tests/browser/` — timeout 300s

### Frontend (`frontend/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server on `:5173` |
| `npm run build` | Builds into `../public/assets` (i.e. `backend/public/assets/`) |
| `npm run preview` | Preview production build |

No tests, lint, or typecheck configured for frontend.

## Architecture

- **Auth**: session-based (`@adonisjs/auth` with `sessionGuard`), **not JWT** — `JWT_SECRET` in `.env` is unused
- **No remember-me**: `useRememberMeTokens: false` — user must re-login after session expires (2h)
- **Role enum**: `admin | bendahara | warga` (column `users.role`)
- **User status enum**: `active | pending | suspended`
- **Verification status**: `pending | verified | rejected` (on `warga_profiles`)
- **Status huni**: `pemilik | penyewa` (on `warga_profiles`)
- **API prefix**: all routes under `/api`
- **Onboarding flow**: admin creates warga account → `requiresOnboarding: true` → warga logs in → POST `/api/warga/onboarding` → admin verifies

### Import aliases (backend)

Defined in `package.json#imports` (not only tsconfig):
`#controllers/*`, `#models/*`, `#services/*`, `#middleware/*`, `#config/*`, `#start/*`, `#validators/*`, `#exceptions/*`, `#tests/*`, `#database/*`, `#providers/*`, `#utils/*` — all map to `./app/...` or respective directories.

> **No `app/validators/` directory exists yet** — VineJS validators are planned but not implemented. Validation is done inline in controllers.

### Frontend routing

Uses **`react-router-dom`** (not Inertia). Pages are in `src/pages/{admin,bendahara,warga,auth}/`. Routes defined in `src/App.jsx` with `ProtectedPage` wrapper = `ProtectedRoute` + `AppLayout`. `ProtectedRoute` checks auth via `GET /api/auth/me` and enforces `allowedRoles` — admin role bypasses the check. Auth cache is module-level (cleared on logout/expire).

### Frontend build & dev

- **Build** output goes to `backend/public/assets/` (via `@adonisjs/vite/client`)
- **Dev**: two separate dev servers. Frontend on `:5173`, backend on `:3333`. Backend proxies to frontend Vite dev server in development.
- Base URL in frontend paths should use `import.meta.env.BASE_URL` (set in `Main.jsx` `<BrowserRouter basename>`)

## Frontend CSS conventions

- **TailwindCSS 4** (`@import "tailwindcss"` in `src/index.css`) — but **most styling uses standalone CSS files** in `src/assets/style/css/`, one per page/component
- **Design system tokens** are CSS variables in `AppLayout.css` (`:root`): `--clr-primary`, `--clr-title`, `--clr-body`, `--sidebar-w: 256px`, `--topbar-h: 64px`, etc.
- **Font**: DM Serif Display (headings) + DM Sans (body), imported via Google Fonts in `AppLayout.css`
- **No CSS-in-JS or UI framework** — custom CSS only
- **Responsive breakpoints**: 1024px (sidebar), 768px (tablet), 480px (mobile), 360px
- **Common classes** shared across pages: `.ad-panel`, `.ad-header`, `.ad-header__title`, `.ad-header__sub`, `.ad-card`, `.ad-card__body`, `.ad-empty`, `.ad-badge` (defined in `Darurat.css`)
- Each page component imports its own CSS file

## Phase Progress

### ✅ Completed

**Phase A — Fix nominal default save + UX**
- Fixed save bug: add `useRef` for `jumlah_default` in `KelolaKategoriIuran.jsx` to avoid stale closure
- Replaced RupiahInput with custom Rp input + thousand separator display (`formatDisplay` with `Intl.NumberFormat`)
- Added `tahunan` to `periodeOptions` validator (was only `bulanan|insidental`)

**Phase A.2 — RupiahInput fix**
- `formatRupiah` now uses `parseInt(value, 10)` instead of `value.replace(/\D/g, "")` — handles decimal strings like `"20000.00"` correctly (was doubling the value)

**Phase A.3 — Lucid camelCase serialization mismatch**
- Lucid serializes model columns as camelCase (`jumlahDefault`) but frontend accessed snake_case (`jumlah_default`) → `undefined` → `Rp 0`
- Fix: all frontend accesses use `jumlahDefault` now (`KelolaKategoriIuran.jsx`, `AdminIuran.jsx`)

**Phase B.1 — Backend installment (cicilan) system**
- Migration `add_sisa_to_iurans`: raw SQL ALTER TABLE + UPDATE existing rows
- Migration `create_iuran_payments_table`: id (UUID), iuran_id (FK), jumlah, metode_pembayaran, paid_at, keterangan, admin_id (FK)
- Model `IuranPayment` with `belongsTo` Iuran + User
- Updated `Iuran` model: `sisa` column + `payments` hasMany
- `IuranController.store` & `.generate`: sets `sisa = jumlah`
- `POST /api/admin/iuran/:id/bayar`: validates, creates payment, decrements sisa, auto-set lunas
- `GET /api/admin/iuran/:id/payments`: iuran detail + payment history
- `index`, `monitoring`, `tagihanSaya` now include `sisa`

**Phase B.2 — Frontend AdminIuran installment UI**
- Sisa column in table (red when > 0)
- Bayar Cicilan button (Banknote icon) — modal with jumlah, metode, keterangan
- Riwayat button (History icon) — modal with payment history table
- Added `.ai-modal--large` CSS class

### 📌 Pending

**Phase C — Warga can see installment history + bayar cicilan**
**Phase D — Laporan cicilan**

## Quirks

- **Node >=24** required (`backend/package.json:engines`)
- **Google Sheets sync** is non-critical: all errors caught silently, request continues
- **Password hashing** is automatic via `@beforeSave()` hook on the `User` model — never hash or compare passwords manually
- **Column name is `password_hash`**, not `password` (User model, `serializeAs: null`)
- **NIK/KK validation**: exactly 16 digits, always `.toString().trim()` before use
- **TypeScript 6** + `@adonisjs/tsconfig` — two tsconfig projects: root `tsconfig.json` and `inertia/tsconfig.json`
- **Editorconfig** at `backend/.editorconfig`
- **Prettier** config from `@adonisjs/prettier-config`
- **ESLint** config from `@adonisjs/eslint-config`
- **Lint order**: lint → typecheck → test
- **Filter persistence**: admin pages (Sampah, Qurban, Keuangan) store selected bulan/tahun in `localStorage`
- **Emergency FAB** is rendered inside `AppLayout` — appears on all authenticated pages, all roles
- **Backend HMR**: `hotHook.boundaries` watches `./app/controllers/**/*.ts` and `./app/middleware/*.ts`
- **VineJS dates** are automatically transformed to Luxon `DateTime` (configured in `start/validator.ts`)

## Sensitive files

- `.env` files (both `backend/` and `frontend/`) — never commit
- `backend/config/google-service-account.json` — never commit (gitignored)
- `backend/.adonisjs/` — generated, gitignored
- `backend/tmp/` — build artifacts, gitignored
