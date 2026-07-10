# Responsive CSS — Admin Pages

## Status: Partial (ongoing fixes)

Three admin pages have responsive CSS breakpoints but still have overflow/adaptation issues on mobile (360px–480px).

## Files Modified

### `src/assets/style/css/AdminDashboard.css`

| Breakpoint | Changes |
|------------|---------|
| **768px** | `.stat-card` padding → `var(--space-md)`, icon 38px, value 1.25rem; `.chart-bars` height 140px, bar width 14px; `.approval-item` flex-wrap + actions full-width; `.dashboard-grid` single column |
| **480px** | `.stats-grid` 1fr; `.stat-card` padding 10px, icon 32px, value 0.9rem, title/subtitle margin 0; `.approval-item` padding 8px 10px, avatar 32px, btn-icon 32px; `.chart-bars` height 120px, bar 12px |
| **360px** | `.stat-card` padding 6px 8px, icon 28px, value 0.82rem; `.approval-item` padding 6px 8px, avatar 28px, btn-icon 28px; `.chart-bars` height 85px, bar 10px; `.admin-dashboard` padding 12px |

### `src/assets/style/css/AdminIuran.css`

| Breakpoint | Changes |
|------------|---------|
| **1024px** | `.ai-stats` 2-col grid; hide column 2 (NIK) |
| **768px** | `.ai-header` column; `.ai-period` full-width; `.ai-toolbar` column; hide column 4 (Jumlah) |
| **480px** | `.ai-stats` 1fr; `.ai-header > div:last-child` column; hide column 8 (Tanggal) |
| **360px** | `.ai-period` column; narrow padding 12px; table cells 6px 4px, font 0.65rem |

### `src/assets/style/css/ManajemenWarga.css`

| Breakpoint | Changes |
|------------|---------|
| **1024px** | Hide column 2 (NIK) |
| **768px** | `.mw-header` column; `.mw-table` small padding; hide column 4 (Status Huni); sidebar-aware padding |
| **480px** | `.mw-header__right` full-width buttons; `.mw-filter-group` column; hide column 6 (Terdaftar) |
| **360px** | table font 0.6rem; cells 4px 2px; avatar 28px; pagination compact |

## Known Issues

- **StatCards on 360px**: Still feels too tall/wide relative to small screen. Ideal would be a horizontal layout (icon + text side-by-side) but flex row approach caused horizontal overflow on long rupiah strings.
- **Approval items**: Details (NIK, alamat, time) stack vertically but still take 3+ lines.
- **Chart bars**: Very small at 360px (10px wide, 85px tall) — labels may be hard to read.
- **Column hiding**: Statically hides NIK (1024px), Jumlah (768px), Tanggal (480px) — may hide wrong columns if table structure changes.

## Approach so far

- **No JSX changes** — all adaptation via CSS media queries only
- **Minimal approach**: tried Tailwind full refactor → reverted (CSS got messy). Stuck with original CSS + targeted overrides.
- **Resets**: `word-break: break-word` on stat values to prevent overflow; `min-width: 0` on chart container
