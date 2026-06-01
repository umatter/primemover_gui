# CLAUDE.md — PrimeMover GUI

Guidance for Claude Code working in this Angular frontend.

## Stack
- **Angular 17** (standalone components + some NgModules), **TypeScript 5.4**
- **Tailwind CSS 3.4** (+ `@tailwindcss/forms`) for styling; **Angular Material 17** (autocomplete, form-field) and **Angular CDK**
- **NgRx** store + **@ngrx/data** for entity CRUD; **ngx-translate** (EN/DE) for i18n
- Path aliases: `@core/*`, `@shared/*` (see `tsconfig.json`)

## Commands
```bash
npm start            # ng serve → http://localhost:4200
npm run build        # ng build
npm run lint         # eslint + stylelint --fix
npm run format       # prettier --write .
```

## Design System (read before touching UI)
Visual direction, tokens, and rules live in **`.impeccable.md`** and the `## Design Context`
section below. Key implementation facts:
- **Tokens** are CSS custom properties (OKLCH) in `src/styles.scss` `:root`, exposed as Tailwind
  colors in `tailwind.config.js` (`bg`, `surface`, `surface-2`, `line`, `ink`, `muted`, `faint`,
  `brand`, `accent`, `success`/`warning`/`danger`/`info` + their `-tint` variants).
  Use these instead of raw Tailwind palette colors (no more `indigo-600`, `gray-*`).
- **Fonts**: `font-display` = Spectral (headings), `font-sans` = Hanken Grotesk (default UI),
  `font-mono` = Spline Sans Mono (IDs/status codes only). Loaded in `src/index.html`.
- **Product framing**: an **Experiment is a project workspace**, not an admin table. A "crawler" is
  surfaced to users as a **Bot** (simulated user); agent + proxy + configuration are its setup details,
  demoted into a power-user **Library**. See `.impeccable.md` for the full rationale.

---

## Design Context

### Users
Two roles on **algorithm / recommender-system studies** (bots act as simulated users on platforms like
YouTube to observe what the algorithm surfaces):
- **PIs** — researchers who *design* studies; domain-smart, not necessarily technical; need plain
  language and guidance.
- **RAs / operators** — technical staff who *operate* studies; value speed, bulk actions, keyboard
  efficiency, and access to raw settings.
Same screens must serve a guided first-run (PI) and a fast power-mode (RA).

### Brand Personality
**Calm, scientific, trustworthy.** Precise, measured, quietly authoritative — a research instrument, not
a marketing site. Honest about state. Standalone product identity (not institutional). The user should
feel in control and confident the data will be sound.

### Aesthetic Direction
Light theme; refined-empirical tone; generous whitespace, strong type hierarchy, restrained palette with
one confident **signal amber** accent over deep **Prussian ink-blue** and warm-cool paper neutrals.
Type: **Spectral** (display serif) + **Hanken Grotesk** (UI). Anti-references: the old admin-grid feel,
default indigo, system fonts, and generic AI-SaaS (cyan/purple gradients, identical card grids,
glassmorphism).

### Design Principles
1. **Hierarchy over inventory** — show Experiment → Bots → Runs → Jobs, not seven sibling lists.
2. **Plain language first, precision on demand** — researcher terms up front; raw entities behind
   "Advanced" / Library.
3. **Calm confidence** — space, restraint, one accent, strong type. 60-30-10 by visual weight.
4. **Guide the first step, respect the hundredth** — guided wizard + defaults for setup; fast power
   tools for daily operators.
5. **Trust through transparency** — honest, calm status and progress.
