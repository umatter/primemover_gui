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

## Tests: every spec runs

`ng test` runs every `src/**/*.spec.ts` (`tsconfig.spec.json` `include` and
`angular.json` `test.include`). The ~73 auto-generated `should create` stubs
that used to be quarantined there never ran and were deleted (#50) — don't
recreate scaffolds that assert nothing. Standalone components in specs need
`imports:`, not `declarations:`; components with animations need
`NoopAnimationsModule`; an `OnPush` component will not re-render from a field
assigned by the test — go through a real DOM event. Set inputs with
`fixture.componentRef.setInput()` when the component reacts in `ngOnChanges`.

## Dates: `HH`, never `hh`

Angular's DatePipe reads lowercase `hh` as the **12-hour** clock
(`dateGetter(Hours, 2, -12)`). Every date format in this app uses `HH`; the one
exception was `queue-create.component.ts`, which prefilled a run's `start_at`
through `'yyyy-MM-ddThh:mm'` and posted the form value straight back -- so
picking an existing run scheduled for 14:00 prefilled 02:00 and saving rewrote
the run twelve hours earlier. Midnight went the other way, 00:00 to 12:00.
Morning runs were unaffected, which is why it survived. Nothing errored; the run
simply moved.

Pinned by `queue-create.format.spec.ts`. Any format string that reaches the API
deserves the same treatment.

## Deployment

One image, any deployment: `Dockerfile` builds the prod bundle and serves it
with httpd on **8080**. The API endpoint is injected at container start from
`API_ENDPOINT` (`httpd-pre-init/set-config.sh`); unset, the bundle falls back
to the same-origin path `/api/v1`.

- CI publishes `ghcr.io/umatter/primemover_gui:sha-<short>` on every `main`
  merge (`publish.yml`); there is no `latest` on purpose.
- On ex63 the GUI runs from `ex63-infra/compose/apps.yml` (pin the sha there,
  `make up`) at `https://primemover.qamelab.org`, and the API is routed
  same-origin under `/api` — so `API_ENDPOINT` is deliberately **unset**.
- Sign-in posts to `/auth/token`; a wrong password is a **400** from Passport,
  not a 401. Settings (`/user/settings`) has the change-password form.

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
