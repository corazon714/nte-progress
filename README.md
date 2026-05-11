# NTE Progress

> Desktop companion app for **Neverness to Everness** — track daily/weekly/monthly progression, plan pulls and awakenings, and never miss a reset.

Built with [Tauri 2](https://v2.tauri.app/), Vue 3, TypeScript, Tailwind 4, and Pinia. All data is stored locally; nothing is sent anywhere.

---

## Features

- **Setup wizard** — pick region (EU / Asia / US), enter Hunter & Tycoon levels, your owned characters with awakening (A0–A6), and owned S-Class Arcs.
- **Server-time-aware countdowns** — daily (5 AM local server), weekly (Monday), monthly (1st of month), all computed via your region's timezone.
- **Dashboard** — at-a-glance reset timers, critical-tasks panel, **Character Pixels** cap projection ("caps in 3.2 h, spend by ~21:40"), **City Stamina** weekly-spend tracker, currency snapshot, unclaimed redeem codes.
- **Daily / Weekly / Monthly checklists** — research-backed tasks (priority-graded: critical → high → medium → low), auto-filtered to your roster (Hathor/Edgar/Chiz/etc. tasks hidden if you don't own them), per-cycle persistence with auto-pruning of old cycles.
- **Currencies & Pity** — track Annulith, Solid/Fabricated Dice, Tri-Keys, Lost/Warp Pieces, Fons, Beetle Coins, Mhm! Coins, plus pity counters with soft-pity indicators for Limited (90/70), Standard (90/70), Arc S-rank (60/50), and Arc Featured (80/70).
- **Annulith income tracker** — log your real weekly Annulith gains; the planner uses your rolling 8-week average once you've logged 2+ weeks.
- **Pull & Awakening Planner** — pulls/Annulith/weeks-to-target for any owned-or-targeted character at any awakening level, accounting for current pity, dice inventory, and spending profile (F2P ×1.0, Monthly Card ×1.55, Battle Pass ×1.22, Both ×1.77).
- **Pull simulator** — 10,000-trial Monte Carlo simulating the 0.6 % base S-rate, soft-pity ramp, hard pity at 90, and 50/50 featured logic with guarantee on prior loss. Reports P50 / P75 / P90 / mean pulls and tells you whether your current Annulith is below median, ~50 %, or comfortably within P90.
- **Tips & Tricks** — searchable, category-filtered knowledge base sourced from the in-tree research notes.
- **Notifications** — opt-in alerts: daily reset (1 h before, if critical tasks open), weekly reset (6 h before), Character Pixels cap warning (configurable 1–12 h ahead), City Stamina expiring (12 h before weekly reset).
- **Backup & restore** — schema-versioned JSON export/import in Settings; safe across future app updates.
- **NTE-tone UI** — deep purple background, neon violet / cyan / magenta accents, glassmorphism panels, Rajdhani display font.

---

## Tech stack

| Layer       | Tech                                                               |
|-------------|--------------------------------------------------------------------|
| Shell       | Tauri 2 (Rust)                                                     |
| Frontend    | Vue 3 + TypeScript + Vite 6                                        |
| Styling     | Tailwind CSS 4 (`@tailwindcss/vite`, `@theme` directive)           |
| State       | Pinia (setup stores) + persisted via `@tauri-apps/plugin-store`    |
| Routing     | vue-router 4 (hash history)                                        |
| Time        | `date-fns` + `date-fns-tz` (server-tz reset math)                  |
| Markdown    | `markdown-it` (Tips view)                                          |
| Notifications | `@tauri-apps/plugin-notification`                                |

Frontend data is bundled as JSON ([characters](src/data/characters.json), [arcs](src/data/arcs.json), [tasks-daily](src/data/tasks-daily.json), [tasks-weekly](src/data/tasks-weekly.json), [tasks-monthly](src/data/tasks-monthly.json), [codes](src/data/codes.json), [tips](src/data/tips.json)) so updates are a single edit + rebuild — no backend.

---

## Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Rust** stable toolchain — install via [rustup](https://rustup.rs/)
- Windows: Microsoft C++ Build Tools + WebView2 (pre-installed on Win 11)
- macOS: Xcode CLT (`xcode-select --install`)
- Linux: see Tauri's [prerequisites](https://v2.tauri.app/start/prerequisites/)

---

## Getting started

```sh
pnpm install
pnpm tauri dev        # desktop dev with hot-reload
```

Other scripts:

```sh
pnpm dev              # Vite only (browser at http://localhost:1420)
pnpm build            # vue-tsc + vite build
pnpm tauri build      # bundle a release installer
```

Run typecheck without emitting:

```sh
pnpm exec vue-tsc --noEmit
```

---

## Project layout

```
src/
  App.vue                  # Mounts AppShell; loads all stores
  main.ts                  # Pinia + router + Tailwind entry
  router/                  # Hash router + setup-complete guard
  views/                   # Setup, Dashboard, Daily/Weekly/Monthly, Currencies, Planner, Tips, Settings
  components/              # AppShell, GlassPanel, ResetCountdown, TaskCard, ChecklistView, ElementTag
  stores/                  # user, checklist, currency, settings (Pinia, autosaved)
  composables/             # useTauriStore, useResetTimer, useNotifications, useBackup
  data/                    # Bundled JSON: characters, arcs, tasks-*, codes, tips
  styles/index.css         # Tailwind 4 + @theme tokens + .glass/.btn/.input components
  types.ts                 # Shared TS types
src-tauri/                 # Rust shell, plugins (store + notification), capabilities, icons
researchs/                 # Research notes (gitignored)
```

### Customizing the app icon

Edit [src-tauri/icons/app-icon.svg](src-tauri/icons/app-icon.svg), render to a 1024×1024 PNG at `src-tauri/icons/app-icon.png`, then regenerate every platform variant:

```sh
pnpm exec tauri icon src-tauri/icons/app-icon.png
```

---

## Data & privacy

- Everything is persisted locally to `nte-progress.json` via the Tauri store plugin, with a `localStorage` fallback when running in a plain browser.
- Use **Settings → Export backup…** to save a versioned JSON copy of your profile, currencies, income log, checklists, and settings.
- Use **Settings → Import backup…** to restore. Newer-schema backups are refused with a clear message so you can update the app first.
- No network calls. No telemetry.

---

## Releasing

Local build → upload to GitHub Releases manually.

```sh
pnpm release 0.2.0          # bumps package.json, tauri.conf.json, Cargo.toml + Cargo.lock
pnpm tauri build            # produces installers in src-tauri/target/release/bundle/
git add -A
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push && git push --tags
```

Then on GitHub: **Releases → Draft a new release**, pick the tag, drag in the installers from `src-tauri/target/release/bundle/` (`.msi`, `.exe`, `.dmg`, `.deb`, `.AppImage` depending on platform), publish.

---

## Roadmap

- Banner / event calendar with auto-surfacing on Dashboard
- Awakening cost calculator (A0→A6 dice + Annulith totals)
- Stamina-spend recommender (best node for your Hunter Lv & roster)
- Tray icon + minimize-to-tray for background notifications
- Auto-update via `tauri-plugin-updater`
- Vitest coverage on `useResetTimer` across DST edges

---

## License

Personal project. No affiliation with HoYoverse or the Neverness to Everness team. Game names, characters, and currency labels are trademarks of their respective owners and are referenced here only for compatibility.
