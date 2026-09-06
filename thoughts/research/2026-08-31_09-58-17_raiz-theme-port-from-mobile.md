---
date: 2026-08-31T09:58:17-03:00
researcher: juanduzac (duzacj@gmail.com)
git_commit: cf5b35c607ce6c2b4a2b169cc7230731a0197ddc
branch: feature/mobile-theme-redesign-research
repository: IngenieriaParaLaAlimentacion/backoffice
topic: "Porting the mobile app's 'Raíz' UI/UX theme redesign (app_mobile PR #42) to the web backoffice"
tags:
  [
    research,
    codebase,
    design-system,
    theming,
    tailwind-v4,
    shadcn,
    raiz-palette,
    cross-repo,
  ]
status: complete
last_updated: 2026-08-31
last_updated_by: juanduzac
---

# Research: Porting the mobile "Raíz" theme redesign to the web backoffice

**Date**: 2026-08-31 09:58:17 -03:00
**Researcher**: juanduzac
**Git Commit**: `cf5b35c607ce6c2b4a2b169cc7230731a0197ddc`
**Branch**: `feature/mobile-theme-redesign-research`
**Repository**: `IngenieriaParaLaAlimentacion/backoffice` (worktree `/Users/juanduzac/conductor/workspaces/backoffice/troy`)

## Research Question

The mobile app repo recently merged a PR doing a UI/UX theme refactoring/redesign. Find
all the necessary files and info for applying the same redesign to the web backoffice.

---

## Summary

**The PR is `app_mobile` #42 — "feat: adopt the shared Raíz palette and type stack"**, merged
2026-08-24 as commit `b1bb51e`, branch `feature/refactor-ui-theme`, +490/−106 across 31 files.
It closes mobile issue #44 "[US] UI System design".

Five things you need to know before planning the port:

1. **There is a ticket for exactly this work already**: backoffice issue **#58**, "[TASK] Actualizar
   estetica backoffice para que coincida con la de la app" (created 2026-08-29, labels `backoffice`,
   `frontend`). It carries the target mockups and two extra scope items beyond re-theming:
   the product has been **renamed to "Raíz"**, there is a **new logo**, and the dashboard/sidebar
   duplication should be reorganized.

2. **The mobile PR's own claim that "the web app had moved to the Raíz brand" is not true of this
   repo.** The backoffice has never contained a single hex, name, or font from the palette — verified
   across every branch and the full history of both clones, plus an org-wide code search. The design
   lived only in Notion and in mockups; **mobile shipped it first**. Issue #58 was filed five days
   _after_ mobile PR #42 merged and asks the backoffice to match _the app_. So this is a port
   from mobile → web, not a re-sync.

3. **The authoritative machine-readable spec today is `app_mobile`'s `Palette.kt`** — 12 spec colors
   with their Spanish names plus 4 explicitly mobile-only "derived" tints. The prose source is a
   Notion page linked from issue #58:
   `https://app.notion.com/p/Paleta-de-colores-y-referencias-39143152a11c80e4b60ff422a9731755`
   (external, not mirrored into any repo — I could not read it).

4. **The target mockup is a real HTML mockup, and I sampled it.** It is attached to issue #58 and
   confirms the palette pixel-for-pixel, but it **diverges from mobile on two surface values**:
   the web uses **white cards (`#FFFFFF`)**, not mobile's derived `#FDFBF4`, and a **table-header
   band of `#F1EFE4`**, not mobile's derived `#EDEADD`. Mobile's `Palette.kt` even says why: those
   four derived tints were invented _because_ the spec omits surfaces mobile doesn't have. On web
   you should take the mockup's values, not mobile's derived ones. Mockups saved to
   `.context/raiz-mockups/`.

5. **The backoffice is unusually well-positioned for the token swap and unusually badly positioned
   for everything else.** All 7 files in `components/ui/` are 100% token-driven — zero hardcoded
   colors — so they re-theme for free from `globals.css`. But ~35 hardcoded-color sites across
   15 files sit outside the token system (emerald/amber/orange status pills duplicated in 4 places,
   3 hex chart strokes, a fully hardcoded auth mini-theme), and the sidebar — the single most
   visually load-bearing element of the redesign — uses `bg-card` while all 8 `--sidebar-*` tokens
   sit **defined but completely unused**.

Rough shape of the work: **1 CSS file + 1 layout file gets you ~70% of the visual change**;
the remaining 30% is de-hardcoding 15 files and rebuilding the sidebar for a dark surface.

---

## Detailed Findings

### 1. Provenance — where the design actually comes from

| Source                                   | Has hexes               | Has Spanish names | Has fonts   | Reachable                                 |
| ---------------------------------------- | ----------------------- | ----------------- | ----------- | ----------------------------------------- |
| Notion "Paleta de colores y referencias" | presumably              | —                 | —           | external only, linked from backoffice #58 |
| `app_mobile/.../theme/Palette.kt`        | **yes, 12 + 4 derived** | yes               | no          | ✅ on disk                                |
| Issue #58 mockup images                  | yes (sampled)           | no                | visually    | ✅ saved to `.context/raiz-mockups/`      |
| `app_mobile/claude.md` §Theme            | no                      | partial           | **yes**     | ✅ on disk                                |
| mobile issues #44 / #43                  | no                      | yes               | yes         | ✅ via `gh`                               |
| backoffice repo, any branch, any commit  | **nothing**             | **nothing**       | **nothing** | —                                         |

Mobile issue #43 (closed as duplicate of #44) has the clearest statement of the division of labour:

> La paleta y las tres familias tipográficas ya están definidas por el equipo web; esta historia las
> adopta, no las decide.
>
> El sistema web tiene superficies que no existen en mobile (sidebar, filas de tabla) y no define
> tintes de contenedor salvo para la fila de alerta. Los tonos que falten se derivan del par
> papel/línea y quedan marcados como derivados.

That second paragraph is the licence to _not_ copy mobile's four derived tints verbatim — the web
is the platform that actually has the sidebar and table rows, and the mockup defines them.

Backoffice issue #58 also adds scope the mobile PR had no reason to cover:

> Sumado a que el nombre de la aplicación cambio a **_"Raíz"_** y aún no se ve reflejado en el backoffice.
>
> ### Extra:
>
> Sumado a la refactorización estética, vimos que lo que aparece en el panel principal del dashboard
> y en el sidebar es un tanto redundante […] Deberíamos reorganizarlo.

### 2. The palette (`AlPalette`) — canonical hexes

`/Users/juanduzac/dev/ingenieria-alimentacion/app_mobile/composeApp/src/commonMain/kotlin/ar/com/ingenieriaalimentacion/core/design_system/theme/Palette.kt`

| Token         | Hex       | Spanish name    | Role                                                          |
| ------------- | --------- | --------------- | ------------------------------------------------------------- |
| `EarthDark`   | `#26362A` | Tierra oscura   | **sidebar on web**, bottom nav on mobile                      |
| `EarthMid`    | `#33452F` | Tierra media    | hover/active on top of EarthDark                              |
| `Paper`       | `#F6F4EC` | Papel cálido    | content background                                            |
| `PaperRaised` | `#FDFBF4` | —               | **derived (mobile-only)** — see §4, web uses `#FFFFFF`        |
| `PaperSunken` | `#EDEADD` | —               | **derived (mobile-only)** — see §4, web mockup uses `#F1EFE4` |
| `PaperLine`   | `#DED9C8` | Línea papel     | separators, borders                                           |
| `Ink`         | `#26251F` | Tinta           | body text                                                     |
| `InkSoft`     | `#6B6759` | Tinta suave     | supporting text                                               |
| `Sage`        | `#7A8F5C` | Salvia          | soft accents, avatars                                         |
| `SageDeep`    | `#4E6339` | Salvia profunda | icons, eyebrows, status text, links                           |
| `SagePale`    | `#E6EBDC` | —               | **derived** — pale sage container                             |
| `Mustard`     | `#C99A2E` | Mostaza         | primary action, brand accent                                  |
| `MustardDark` | `#8A6614` | Mostaza oscura  | pressed state; mustard-toned text on paper                    |
| `MustardPale` | `#F7EAD0` | —               | **derived** — pale mustard container                          |
| `Brick`       | `#A9432E` | Ladrillo        | critical alerts                                               |
| `BrickPale`   | `#F1E1DA` | Ladrillo claro  | alert row background                                          |

The file's contract: _"These are the only literal colors in the codebase; everything else consumes
them through `AlColors`."_

### 3. Semantic roles (`AlColors`) and the shadcn-shaped slot map

Mobile keeps three layers: `Palette.kt` (hexes) → `AlColors` (semantic roles) → `AlKomoStyles`
(the component-library contract). **`AlKomoStyles` is the one to copy** — KomoUI's `KomoStyles`
contract is _literally the shadcn token set_ (`background`/`foreground`/`card`/`popover`/`primary`/
`secondary`/`muted`/`accent`/`destructive`/`border`/`input`/`ring`/`chart1-5`/`sidebar*`). Mobile
already did the translation work; you can transcribe it almost 1:1 into `globals.css`.

`/Users/juanduzac/dev/ingenieria-alimentacion/app_mobile/composeApp/src/commonMain/kotlin/ar/com/ingenieriaalimentacion/core/design_system/theme/KomoStyles.kt`

| shadcn/Komo slot                         | Palette     | Hex       | Note                                                     |
| ---------------------------------------- | ----------- | --------- | -------------------------------------------------------- |
| `background`                             | Paper       | `#F6F4EC` |                                                          |
| `foreground`                             | Ink         | `#26251F` |                                                          |
| `card` / `popover`                       | PaperRaised | `#FDFBF4` | **web: use `#FFFFFF`** (mockup)                          |
| `card-foreground` / `popover-foreground` | Ink         | `#26251F` |                                                          |
| `primary`                                | Mustard     | `#C99A2E` |                                                          |
| `primary-foreground`                     | **Ink**     | `#26251F` | **not white** — white on mustard is 2.6:1                |
| `secondary` / `muted`                    | PaperSunken | `#EDEADD` | **web: consider `#F1EFE4`** for table headers            |
| `secondary-foreground`                   | Ink         | `#26251F` |                                                          |
| `muted-foreground`                       | InkSoft     | `#6B6759` |                                                          |
| `accent`                                 | SagePale    | `#E6EBDC` | shadcn `accent` = hover surface, **not** the brand green |
| `accent-foreground`                      | SageDeep    | `#4E6339` |                                                          |
| `destructive`                            | Brick       | `#A9432E` |                                                          |
| `destructive-foreground`                 | Paper       | `#F6F4EC` |                                                          |
| `border` / `input`                       | PaperLine   | `#DED9C8` |                                                          |
| `ring`                                   | SageDeep    | `#4E6339` |                                                          |
| `chart-1`                                | Sage        | `#7A8F5C` |                                                          |
| `chart-2`                                | SageDeep    | `#4E6339` |                                                          |
| `chart-3`                                | Mustard     | `#C99A2E` |                                                          |
| `chart-4`                                | MustardDark | `#8A6614` |                                                          |
| `chart-5`                                | EarthDark   | `#26362A` |                                                          |
| `sidebar`                                | EarthDark   | `#26362A` |                                                          |
| `sidebar-foreground`                     | Paper       | `#F6F4EC` |                                                          |
| `sidebar-primary`                        | Mustard     | `#C99A2E` |                                                          |
| `sidebar-primary-foreground`             | Ink         | `#26251F` |                                                          |
| `sidebar-accent`                         | EarthMid    | `#33452F` |                                                          |
| `sidebar-accent-foreground`              | Paper       | `#F6F4EC` |                                                          |
| `sidebar-border`                         | EarthMid    | `#33452F` |                                                          |
| `sidebar-ring`                           | Sage        | `#7A8F5C` |                                                          |

Roles mobile has that shadcn does not, and which the backoffice needs (see §8): `warning`
(`MustardDark #8A6614`), `warningContainer` (`MustardPale #F7EAD0`), `accentContainer`
(`SagePale #E6EBDC` — success container), `dangerContainer` (`BrickPale #F1E1DA`).

**Dark mode is pinned off on mobile**, deliberately: _"The palette is light-only (warm paper), so the
system dark mode is pinned off rather than falling back to KomoUI's dark neutrals."_ There is no
`alDarkColors`, no `darkColorScheme`, no `isSystemInDarkTheme()` call.

### 4. What the target mockup says that mobile does not

Mockup images from issue #58 are saved at `.context/raiz-mockups/`:

| File                          | What it is                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `01-target-design.png`        | **The target** — an HTML mockup of a "Mis establecimientos" table screen with the dark-earth sidebar                     |
| `02-app-current.png`          | The shipped mobile Home screen after PR #42 (reference for how the palette reads in practice)                            |
| `03-logo-new.png`             | The new logo — the node-graph tree mark redrawn in sage/earth greens with one mustard node on papel cálido               |
| `04-dashboard-redundancy.png` | Current backoffice dashboard, with the sidebar nav and the "Accesos disponibles" grid boxed in red as redundant          |
| `05-dashboard-proposal.png`   | Proposed replacement home: greeting + context line, two plain counters, one brick alert card, "Acciones rápidas" buttons |

Pixel-sampled values from `01-target-design.png` (dominant color per region, so these are the
actual fills, not antialiasing):

| Region                            | Sampled       | Matches                                                          |
| --------------------------------- | ------------- | ---------------------------------------------------------------- |
| Page background                   | `#F6F4EC`     | Paper ✅                                                         |
| Sidebar                           | `#26362A`     | EarthDark ✅                                                     |
| Sidebar active item fill          | `#33452F`     | EarthMid ✅                                                      |
| Sidebar active item **left rail** | `#C99A2E`     | Mustard ✅ — a ~4px vertical bar, mobile has no equivalent       |
| Sidebar active item text          | `#F6F4EC`     | Paper ✅                                                         |
| Sidebar inactive text             | ~`#C7CBB8`    | dimmed paper (mobile uses Paper @ 72% alpha ≈ 6.8:1)             |
| "Cerrar sesión"                   | ~`#C88A75`    | **a lightened brick** — raw `#A9432E` on EarthDark is unreadable |
| Card / table body                 | **`#FFFFFF`** | ❗ **not** mobile's `#FDFBF4`                                    |
| Table header band                 | **`#F1EFE4`** | ❗ **not** mobile's `#EDEADD`                                    |
| Table footer / total row          | `#F6F4EC`     | Paper ✅                                                         |
| Row divider                       | `#DED9C8`     | PaperLine ✅                                                     |
| Column header text                | `#6B6759`     | InkSoft ✅ — uppercase, letter-spaced                            |
| Row title                         | `#26251F`     | Ink ✅                                                           |
| Avatar fill                       | `#7A8F5C`     | Sage ✅                                                          |
| "Ver panel →" link                | `#4E6339`     | SageDeep ✅                                                      |
| Alert count "2"                   | `#A9432E`     | Brick ✅                                                         |
| Icon chip behind row icon         | `#EEF1E5`     | ≈ SagePale, slightly lighter than mobile's `#E6EBDC`             |

Also visible in the mockup and worth copying:

- Numbers in the table (`31`, `5`, `2`, `103`, `20`) and the timestamps (`20/08 · 15:17`) are **mono**
  — this is the mobile `data`/`dataSmall` rule applied to a table.
- Column headers are **uppercase, small, letter-spaced, InkSoft** on the tinted band.
- The wordmark is "**Raíz**" in Fraunces next to a small sprout glyph, paper-on-earth.
- The mockup's nav is only 4 items (Inicio / Mis establecimientos / Sujetos / Encuestas) —
  that is an establishment-manager view, **not** the 7-item admin backoffice nav. Do not read
  the mockup as an IA change for the admin sidebar; the IA change is the one in `05-…proposal.png`.

### 5. Typography

Three families, all available on Google Fonts, all loadable via `next/font/google` (which
`docs/conventions.md:56-58` mandates):

| Role                                              | Family            | Weights mobile ships |
| ------------------------------------------------- | ----------------- | -------------------- |
| Display / brand / titles                          | **Fraunces**      | 400, 500, 600        |
| Body and UI                                       | **Work Sans**     | 400, 500, 600        |
| Data (indicator numbers, readings, stamped dates) | **IBM Plex Mono** | **500 only**         |

`app_mobile/.../theme/Type.kt` scale — **no role sets letter-spacing** (all resolve to 0, so use
`letter-spacing: normal`, _not_ Material's defaults):

| Role         | Family        | Weight | Size | Line height | Suggested CSS        |
| ------------ | ------------- | ------ | ---- | ----------- | -------------------- |
| `display`    | Fraunces      | 600    | 32   | 38          | `2rem / 2.375rem`    |
| `title`      | Fraunces      | 600    | 28   | 34          | `1.75rem / 2.125rem` |
| `subtitle`   | Work Sans     | 600    | 18   | 24          | `1.125rem / 1.5rem`  |
| `body`       | Work Sans     | 400    | 16   | 24          | `1rem / 1.5rem`      |
| `bodyStrong` | Work Sans     | 500    | 16   | 24          | `1rem / 1.5rem`      |
| `label`      | Work Sans     | 500    | 14   | 20          | `0.875rem / 1.25rem` |
| `caption`    | Work Sans     | 400    | 12   | 16          | `0.75rem / 1rem`     |
| `dataLarge`  | IBM Plex Mono | 500    | 28   | 34          | `1.75rem / 2.125rem` |
| `data`       | IBM Plex Mono | 500    | 16   | 22          | `1rem / 1.375rem`    |
| `dataSmall`  | IBM Plex Mono | 500    | 12   | 16          | `0.75rem / 1rem`     |

The rule from `app_mobile/claude.md` (and mobile issue #44 CA 4):

> Use the mono roles for numbers that are read as data, not for numbers inside a sentence.

Where mobile applied it, as a template for the backoffice:

- Home dashboard counters → `dataLarge`
- IMC value, weight/height headline reading → `data`
- Supporting weight/height line, measurement timestamp → `dataSmall`
- Names, labels, free text → stayed on Work Sans

**Current backoffice state**: one family only (`Geist`, `app/layout.tsx:4,8,21`), and
`app/globals.css:8-9` has a self-referential `--font-sans: var(--font-sans);` that only works
because `layout.tsx` sets the variable on `<html>`. `--font-heading` aliases `--font-sans` and
has exactly one consumer: `components/ui/card.tsx:41` (`CardTitle`). There is **no `--font-mono`
token at all**.

### 6. Component-level patterns worth porting

From the PR diff (`git show b1bb51e`):

- **Sidebar / brand anchor** (`AlBottomNavBar.kt`) — the mobile equivalent of the web sidebar.
  Chrome moved `surfaceBase → brandSurface`. Selected item: `clip(RoundedCornerShape(corners.md))`
  **before** the click handler (so the ripple is clipped) + `brandSurfaceRaised` fill + `primary`
  (mustard) tint on icon and label. Inactive: `textInverted.copy(alpha = 0.72f)` with the comment
  _"Keeps the inactive label at ~6.8:1 on the dark-earth bar"_ and _"Dimmed paper rather than
  textMuted: ink-on-earth is unreadable."_ The web mockup adds a mustard left rail that mobile
  doesn't have.
- **Avatar** (`AlAvatar.kt`, new) — initials-only, `accentSoft` (Sage) circle with **ink** text,
  _"ink on sage keeps the initials readable where paper would sit at 3.3:1"_. The backoffice has
  no avatar component today; the mockup shows one in the sidebar footer.
- **Status pills** — two near-duplicate components, `AlPill` (capsule, `RoundedCornerShape(percent = 50)`)
  and `AlStatusBadge` (4dp rounded rect). Both share one tone map:

  | Tone    | Container                    | Text                  |
  | ------- | ---------------------------- | --------------------- |
  | Success | `accentContainer` `#E6EBDC`  | `accent` `#4E6339`    |
  | Warning | `warningContainer` `#F7EAD0` | `warning` `#8A6614`   |
  | Danger  | `dangerContainer` `#F1E1DA`  | `danger` `#A9432E`    |
  | Neutral | `surfaceMuted` `#EDEADD`     | `textMuted` `#6B6759` |

  `AlStatusBadge`'s KDoc states the split the backoffice should copy: _"the tone→color mapping lives
  here; the status→(label, tone) localization belongs to the calling feature layer."_

- **Single theme entry point** — `App.kt` collapsed `KomoTheme { AlTheme { … } }` into `AlTheme { … }`,
  and `claude.md` now says _"wrap the app in `AlTheme` only — never in `KomoTheme` directly"_.
  The web analogue is: tokens live in `globals.css`, never restyle `components/ui/*` by hand.
- **Splash** — `#FFFFFF` → `#F6F4EC`, so the first frame is papel cálido (mobile issue #44 CA 10:
  _"sin destello blanco"_). The web analogue is the `<html>`/`body` background and, if added, a
  theme-color meta / favicon background.
- **Token hygiene** — eight files swapped the ad-hoc `body.copy(fontWeight = Medium)` spelling for
  the `bodyStrong` token, with no visual change. The backoffice equivalent is collapsing its
  duplicated class strings (§7).

### 7. Backoffice inventory — what has to change

Root: `/Users/juanduzac/conductor/workspaces/backoffice/troy`. Tailwind **v4, CSS-first, no
`tailwind.config.*`**; shadcn style `base-nova`, baseColor `neutral`, primitives are
**@base-ui/react**, not Radix.

#### 7a. The good news

All 7 files in `components/ui/` (`alert`, `button`, `card`, `input`, `menu.ts`, `multi-select`,
`separator`) contain **zero hardcoded colors** — fully token-driven. `docs/architecture.md:71-77`
already mandates the right path: _"treat those as generated/vendored — extend by composition in
`components/` rather than hand-editing generated primitives"_. Changing `globals.css` re-themes
all of them.

Two soft flags in there anyway:

- `components/ui/card.tsx:15` — card outline is `ring-1 ring-foreground/10`, i.e. derived from the
  _text_ color. A warm-black `#26251F` foreground will tint every card ring warm. Probably fine,
  but re-check; `border-border` (`#DED9C8`) is what the mockup actually shows.
- `components/ui/menu.ts:3` — menu hover is `data-[highlighted]:bg-foreground/10` rather than
  `bg-accent`. Inconsistent with everything else, and will read as a grey wash instead of pale sage.

#### 7b. Theme tokens — `app/globals.css` (129 lines, the only CSS file)

- L1-5 imports, including `@import "shadcn/tailwind.css"` — an **out-of-repo token source** from the
  `shadcn` npm package that may define extra tokens the re-theme has to override.
- L7-48 `@theme inline` — maps utilities to vars. L9 is the circular `--font-sans` noted above.
- L50-83 `:root` — 33 props, currently near-monochrome: `--primary: #000000`, `--background: #f6f4fb`
  (a _cool lilac_, one character away from `#F6F4EC` and the opposite temperature), `--border: #E2E8F0`
  (slate). `--chart-1..5` are **all greyscale**.
- L85-117 `.dark` — 32 props, includes a leftover shadcn **blue/violet** `--sidebar-primary:
oklch(0.488 0.243 264.376)`.
- L119-129 `@layer base` — `border-border outline-ring/50`, `bg-background text-foreground`, `font-sans`.

**Dark mode is dead code.** No theme provider, no `next-themes`, no `classList` toggling anywhere —
grep returns zero hits. The whole `.dark` block and every `dark:` utility is unreachable. Mobile
deliberately pinned dark off; the cheapest consistent move is to **delete the `.dark` block** rather
than maintain an unreachable second palette. (Decision needed — see Open Questions.)

**No `--success` / `--warning` token exists.** That single absence is why every green/amber/orange
state in the app is a raw Tailwind palette class. Adding them is the highest-leverage change.

**All 8 `--sidebar-*` tokens are defined and completely unused** — nothing references `bg-sidebar`,
`text-sidebar-foreground`, etc. For the dark-earth sidebar you either wire them up or delete them.

#### 7c. Hardcoded colors outside the token system — the bulk of the work

~35 sites across 15 files. Nothing in `constants/`, `hooks/`, `lib/`, `context/`, `services/`,
`schemas/`, `types/`, `mocks/` — it's all in `app/` and `components/`.

| File                                                                  | Lines              | What                                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/(auth)/layout.tsx`                                               | 7, 8, 9            | **100% hardcoded auth mini-theme**: `bg-[#f8f9fb]`, an indigo→violet `radial-gradient(… #e0e7ff …, … #ede9fe …)`, `bg-white border-gray-100 shadow-[0_4px_40px_rgba(0,0,0,0.08)]`. Wraps _every_ unauthenticated screen. |
| `components/MeasurementEvolutionChart.tsx`                            | 74, 83, 92         | `stroke="#2563eb"` (Peso), `"#16a34a"` (Talla), `"#d97706"` (IMC)                                                                                                                                                        |
| `components/AlertBadge.tsx`                                           | 31, 32, 37, 38, 43 | orange/amber/emerald severity + normal pill classes                                                                                                                                                                      |
| `app/dashboard/establishments/[id]/EstablishmentAlertBanner.tsx`      | 18, 19, 51         | parallel orange/amber/emerald banner map                                                                                                                                                                                 |
| `app/dashboard/establishments/[id]/EstablishmentFieldWorkersList.tsx` | 21, 22             | emerald/amber relation-status pills                                                                                                                                                                                      |
| `app/dashboard/surveys/page.tsx`                                      | 250, 317           | emerald active pill, inline ternary, duplicated desktop+mobile                                                                                                                                                           |
| `app/dashboard/establishments/(list)/requests/page.tsx`               | 312, 318           | emerald success toast + close button                                                                                                                                                                                     |
| `app/dashboard/requests/establishments/page.tsx`                      | 176, 182           | exact duplicate of the above                                                                                                                                                                                             |
| `app/dashboard/requests/UserRequestReviewPanel.tsx`                   | 178                | amber "email not verified" pill                                                                                                                                                                                          |
| `app/dashboard/establishments/(list)/layout.tsx`                      | 84                 | `bg-destructive … text-white` count badge                                                                                                                                                                                |
| `app/dashboard/requests/layout.tsx`                                   | 94                 | same count badge                                                                                                                                                                                                         |
| 10 files                                                              | —                  | `bg-black/40` dialog backdrop, verbatim, no shared constant                                                                                                                                                              |

The 10 `bg-black/40` sites: `app/dashboard/anthropometric-measurements/page.tsx:555`,
`app/dashboard/establishments/(list)/requests/EstablishmentRequestReviewPanel.tsx:177`,
`app/dashboard/requests/UserRequestReviewPanel.tsx:165`,
`app/dashboard/requests/establishments/EstablishmentAccessReviewPanel.tsx:122`,
`app/dashboard/users/[role]/InviteUserDialog.tsx:93`, `app/dashboard/users/[role]/UserDetailPanel.tsx:66`,
`app/dashboard/surveys/[id]/responses/ResponseDetailPanel.tsx:146`,
`components/subjects/SubjectDetailPanel.tsx:110`, `components/surveys/CreateSurveyDialog.tsx:20`,
`components/MobileNav.tsx:54`.

Note `text-white` on the two count badges is a real risk: it should be `--destructive-foreground`,
because a lighter brand destructive would make white text illegible.

#### 7d. Status maps — four duplicating sources of truth

1. `components/AlertBadge.tsx:29-50` — `SEVERITY_BADGE_CLASS`, `SEVERITY_ROW_CLASS`,
   `NORMAL_BADGE_CLASS`, `NO_DATA_BADGE_CLASS`, `BADGE_CLASS`. Mixed convention: `critical` uses the
   `destructive` **token**, `high`/`medium`/`normal` use **raw palette**.
2. `app/dashboard/establishments/[id]/EstablishmentAlertBanner.tsx:16-20` — same hues, different opacities.
3. `app/dashboard/establishments/[id]/EstablishmentFieldWorkersList.tsx:20-27` — `RELATION_STATUS_CLASS`
   (approved/pending/rejected/revoked) + a `PILL_CLASS` that duplicates `BADGE_CLASS` in intent.
4. `app/dashboard/surveys/page.tsx:246-253` and `:313-320` — activa/inactiva, inline ternary, typed twice.

Label vocabularies (text only, no colors): `constants/establishments.ts:31-52`
(`RELATION_STATUS_OPTIONS`, `RELATION_STATUS_LABELS`, `USER_STATUS_LABELS`) and
`constants/surveys.ts:77-78`. **`USER_STATUS_LABELS` has no color map at all** — user status
renders as plain text today; if the redesign wants pills there, that map has to be created.

Two semantics worth preserving through the refactor:

- `AlertBadge.tsx:39-46` — `NORMAL` (measured & healthy, green) vs `NO_DATA` (never measured, muted)
  is a deliberate, documented distinction.
- `AlertBadge.tsx:9-13` — `SEVERITY_RANK` (`critical: 3, high: 2, medium: 1`) decides which color
  wins per row.

#### 7e. Layout chrome — the sidebar is the main structural job

There is **no shadcn `sidebar` component**; it's fully custom.

- `components/SideBar.tsx` — resizable drawer (220 open / 60 closed / 180-300 drag range, L22-25).
  L113 `<aside className="… bg-card border-r border-border …">` — **currently white, must become
  `bg-sidebar` `#26362A`**. L126-133 `next/image` `/logo.png` 32×32. L159-166 logout button
  `text-destructive border-destructive hover:bg-destructive/10` — raw brick on dark earth will be
  unreadable; the mockup uses a lightened ~`#C88A75`. L172 resize handle `hover:bg-primary/30`.
  L27-63 `navItems` — 7 items, exported and reused by `MobileNav`.
- `components/SideBarItem.tsx:32-37` — **the single most important file for the dark sidebar**:
  ```tsx
  isSelected
    ? "bg-primary/10 text-primary"
    : "text-foreground hover:bg-accent hover:text-accent-foreground",
  ```
  With `--primary: #000000` this is a 10% black wash; on dark earth both `text-foreground` and
  `text-primary` resolve to near-black and it inverts badly. Needs `text-sidebar-foreground` /
  `bg-sidebar-accent` / `text-sidebar-accent-foreground`, plus the mockup's mustard left rail.
- `components/MobileNav.tsx:55` — the drawer panel is also `bg-card`; must move in lockstep.
  L91-98 duplicates the logout button verbatim.
- `components/AppShell.tsx:22` — mobile header `bg-card border-b border-border`; there is **no desktop
  header/topbar** (the `<header>` is `md:hidden`). L37-39 hardcodes the brand string.
- Tab bars — `app/dashboard/establishments/(list)/layout.tsx:68-88` and
  `app/dashboard/requests/layout.tsx:79-98`, identical underline-tab pattern
  (`active: "border-primary text-foreground"`).
- Dashboard stat tiles — `app/dashboard/page.tsx:64-103`, a token-based two-tone
  (`emphasize ? destructive : primary`) system. These are the counters that should get the mono
  `dataLarge` role.
- Row hover — `components/listings/RowAffordance.tsx:10-24`: `ROW_HOVER_CLASS`, `CARD_HOVER_CLASS`,
  `rowStateClass(isSelected, severityClass)`. This is how `SEVERITY_ROW_CLASS` tints reach table rows.

#### 7f. Charts

Recharts `^3.9.0`, **one consumer**: `components/MeasurementEvolutionChart.tsx`.
`--chart-1..5` are consumed **nowhere** (grep: zero hits) and are all greyscale. The chart hardcodes
three hexes (L74/83/92) and leaves `<Tooltip>` (L67), `<Legend>` (L68) and both axes (L59-66)
unstyled, so they inherit Recharts defaults (`#666` axis text, white tooltip box). Only
`<CartesianGrid className="stroke-border" />` (L58) is tokenized.

#### 7g. Brand assets and strings

- `public/logo.png` — raster, must be replaced with the new mark (`03-logo-new.png`). `public/` contains
  only `logo.png` and `mockServiceWorker.js`. **There is no favicon / `app/icon.png`.**
- The string `"Ingeniería Para La Alimentación"` is hardcoded in **three** places and must become
  "Raíz" (or the new naming, whatever it resolves to): `app/layout.tsx:11` (metadata title),
  `components/AppShell.tsx:38`, `app/dashboard/page.tsx:221`. Brand name is not centralized —
  `docs/conventions.md:24` says copy belongs in `constants/<domain>.ts`.
- `app/layout.tsx:21` also has `lang="en"` on a Spanish-language app — worth fixing while in there.

### 8. Proposed token block

Transcribing `AlKomoStyles` with the mockup's web-specific surfaces substituted, plus the four
roles shadcn lacks:

```css
:root {
  /* surfaces */
  --background: #f6f4ec; /* papel cálido */
  --foreground: #26251f; /* tinta */
  --card: #ffffff; /* mockup: white, not mobile's #FDFBF4 */
  --card-foreground: #26251f;
  --popover: #ffffff;
  --popover-foreground: #26251f;
  --secondary: #f1efe4; /* mockup table-header band */
  --secondary-foreground: #26251f;
  --muted: #f1efe4;
  --muted-foreground: #6b6759; /* tinta suave */

  /* action */
  --primary: #c99a2e; /* mostaza */
  --primary-foreground: #26251f; /* INK, never white — white is 2.6:1 */

  /* accent = hover surface, not the brand green */
  --accent: #e6ebdc; /* salvia pálida */
  --accent-foreground: #4e6339; /* salvia profunda */

  /* state */
  --success: #4e6339;
  --success-container: #e6ebdc; /* salvia */
  --warning: #8a6614;
  --warning-container: #f7ead0; /* mostaza oscura */
  --destructive: #a9432e;
  --destructive-foreground: #f6f4ec;
  --destructive-container: #f1e1da; /* ladrillo claro */

  /* lines */
  --border: #ded9c8; /* línea papel */
  --input: #ded9c8;
  --ring: #4e6339;

  /* charts — real hues at last */
  --chart-1: #7a8f5c;
  --chart-2: #4e6339;
  --chart-3: #c99a2e;
  --chart-4: #8a6614;
  --chart-5: #26362a;

  /* sidebar — currently defined but unused; this is where they earn their keep */
  --sidebar: #26362a; /* tierra oscura */
  --sidebar-foreground: #f6f4ec;
  --sidebar-primary: #c99a2e; /* the active-item left rail */
  --sidebar-primary-foreground: #26251f;
  --sidebar-accent: #33452f; /* tierra media, active/hover fill */
  --sidebar-accent-foreground: #f6f4ec;
  --sidebar-border: #33452f;
  --sidebar-ring: #7a8f5c;
  --sidebar-destructive: #c88a75; /* lightened brick — raw #A9432E is unreadable on earth */

  --radius: 0.75rem; /* revisit: mobile corners are 4/8/16dp */
}
```

Plus, in `@theme inline`: `--color-success`, `--color-success-container`, `--color-warning`,
`--color-warning-container`, `--color-destructive-container`, `--color-sidebar-destructive`,
`--font-mono`, and a real `--font-heading`.

Fonts in `app/layout.tsx`:

```ts
import { Fraunces, Work_Sans, IBM_Plex_Mono } from "next/font/google";
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-heading" });
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-sans" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-mono",
});
```

`IBM_Plex_Mono` is not variable on Google Fonts, so `weight` is **required**. Fraunces is variable
(it carries `opsz`/`SOFT`/`WONK` axes). And `globals.css:8-9` must stop being circular:
`--font-heading: var(--font-heading);` / `--font-sans: var(--font-sans);` only work because
`layout.tsx` defines them on `<html>` — keep the names aligned or the whole type stack silently
falls back to system sans.

### 9. Accessibility constraints inherited from the mobile work

These were load-bearing decisions in PR #42 and its review notes; they apply verbatim to the web.

| Pair                               | Ratio     | Verdict                                 |
| ---------------------------------- | --------- | --------------------------------------- |
| White on Mustard `#C99A2E`         | 2.6:1     | ❌ never                                |
| **Ink `#26251F` on Mustard**       | **6.0:1** | ✅ the primary button                   |
| Mustard `#C99A2E` as text on Paper | fails     | ❌ — use `#8A6614`                      |
| MustardDark `#8A6614` on Paper     | 4.8:1     | ✅ — this is why `warning` points there |
| Paper on Sage `#7A8F5C`            | 3.3:1     | ❌ — use ink on sage (avatars)          |
| Paper @ 72% on EarthDark           | ~6.8:1    | ✅ inactive nav items                   |
| Brick `#A9432E` on EarthDark       | too dark  | ❌ — mockup lightens to ~`#C88A75`      |

Mobile issue #44 CA 6 states the requirement explicitly: _"El botón primario es mostaza y el texto
sobre él cumple contraste AA (≥ 4.5:1)."_

### 10. The hue-collision problem the backoffice inherits — and makes worse

The mobile PR flagged it under "Worth a second opinion":

> **`warning` and `primary` now share the mustard hue**, so a _Pendiente_ pill and the primary button
> read as the same family. That is inherent to the palette as specified, not something fixable locally.

The backoffice has a harder version of this: it has **three** alert tiers (`critical` / `high` /
`medium`) currently rendered as destructive-red / orange-500 / amber-500. The Raíz palette has
**no orange** — only brick and mustard. A naive mapping collapses `high` and `medium` onto the same
mustard. Options, none free:

- **(a)** `critical` → solid brick, `high` → brick container + brick text, `medium` → mustard
  container + mustard-dark text. Keeps three tiers distinguishable using only spec colors, at the
  cost of critical/high sharing a hue and differing only in weight.
- **(b)** Derive a single brick-orange midpoint between `#A9432E` and `#C99A2E` and mark it derived,
  exactly as mobile marked its four tints.
- **(c)** Ask the design owner to extend the spec with a third alert tone.

This needs a human decision — see Open Questions.

---

## Code References

### Mobile (source of the design) — `/Users/juanduzac/dev/ingenieria-alimentacion/app_mobile`

- `composeApp/src/commonMain/kotlin/ar/com/ingenieriaalimentacion/core/design_system/theme/Palette.kt` — the 12 spec hexes + 4 derived, with Spanish names. **The file to transcribe.**
- `.../theme/KomoStyles.kt` — palette → shadcn-shaped slots + a Material 3 fallback scheme. **The mapping to copy.**
- `.../theme/Color.kt` — the 20 semantic role names and their doc comments (no hexes).
- `.../theme/Theme.kt` — `alLightColors` role→palette binding; `AlTheme`; `isDarkTheme = false`.
- `.../theme/Type.kt` — the 10-role type scale, families, weights.
- `.../components/navbar/AlBottomNavBar.kt` — the dark-earth chrome + selected-pill pattern.
- `.../components/avatar/AlAvatar.kt` — initials avatar, ink-on-sage.
- `.../components/pill/AlPill.kt`, `.../components/badge/AlStatusBadge.kt` — the 4-tone status map.
- `claude.md:46-74` — the design-system rules section added by the PR.
- `composeApp/src/androidMain/res/values/splash.xml` — `#FFFFFF` → `#F6F4EC`.
- Merge commit `b1bb51e`; PR `IngenieriaParaLaAlimentacion/app_mobile#42`; story issue #44 (dup #43).

### Backoffice (target) — `/Users/juanduzac/conductor/workspaces/backoffice/troy`

- `app/globals.css:1-129` — the only CSS file; all tokens. L8-9 circular font vars; L50-83 `:root`; L85-117 dead `.dark`; L75-82 unused `--sidebar-*`.
- `app/layout.tsx:4,8,11,21` — Geist import, `--font-sans`, hardcoded title, `lang="en"`.
- `components.json` — style `base-nova`, baseColor `neutral`, `tailwind.config: ""`.
- `components/SideBarItem.tsx:32-37` — active/inactive nav coloring; **highest-priority file** for the dark sidebar.
- `components/SideBar.tsx:113,121,126-133,159-166,172` — `bg-card` aside, logo, logout, resize handle.
- `components/MobileNav.tsx:54-55,91-98` — drawer backdrop + panel + duplicated logout.
- `components/AppShell.tsx:22,25,29-39` — mobile header, brand string.
- `components/AlertBadge.tsx:9-50` — severity rank + the four class maps.
- `app/dashboard/establishments/[id]/EstablishmentAlertBanner.tsx:16-20,51` — parallel severity map.
- `app/dashboard/establishments/[id]/EstablishmentFieldWorkersList.tsx:20-27` — relation-status map.
- `app/dashboard/surveys/page.tsx:246-253,313-320` — inline active/inactive pill, twice.
- `app/(auth)/layout.tsx:7-9` — the hardcoded auth mini-theme.
- `components/MeasurementEvolutionChart.tsx:58,59-68,74,83,92` — grid tokenized; strokes/tooltip/axes not.
- `app/dashboard/page.tsx:64-103,221` — stat tiles (mono candidates) + brand string.
- `components/listings/RowAffordance.tsx:10-24` — row hover/selected/severity composition.
- `constants/establishments.ts:14,31-52` — `SELECT_CLASS` + status label vocabulary.
- `lib/geo/georef-provider.ts:63-69` — `INPUT_CLASS` etc., **hand-copied from `components/ui/input.tsx:12`** because the provider builds raw DOM outside React. Restyling `Input` silently diverges from this.
- `docs/architecture.md:71-77` — "change tokens, don't hand-edit `components/ui/`".
- `docs/conventions.md:56-58` (fonts via `next/font/google`), `:59-60` (`next/image`), `:91-93` (no magic classnames), `:104-105` (`cn()` over template literals), `:24` (copy in `constants/<domain>.ts`).
- Ticket: `IngenieriaParaLaAlimentacion/backoffice#58`. Mockups: `.context/raiz-mockups/`.

---

## Architecture Insights

- **Mobile's three-layer theme is the right shape and the backoffice already half-has it.**
  `Palette.kt` (literals) → `AlColors` (semantic roles) → `AlKomoStyles` (library contract) maps
  onto `:root` raw vars → semantic vars → `@theme inline` utility mapping. The backoffice's
  `@theme inline` block _is_ the third layer; it's just pointing at greyscale.
- **The backoffice's real debt isn't the palette, it's that ~35 color decisions live outside the
  token layer.** Mobile issue #44 CA 2 — _"Los valores literales de color viven en una única capa
  del tema. Ninguna pantalla ni componente declara un color propio"_ — is the acceptance criterion
  the backoffice fails hardest. And it's already a stated repo rule
  (`docs/conventions.md:91-93`), so fixing it is in-convention cleanup, not a new opinion.
- **`components/ui/` being 100% tokenized is the reason this port is tractable at all.** The
  `docs/architecture.md` instruction to extend by composition rather than edit generated primitives
  has actually been followed, which means the token swap propagates for free.
- **The web/mobile derived-value split is by design, not drift.** Mobile invented `PaperRaised`/
  `PaperSunken`/`SagePale`/`MustardPale` precisely because the spec omits surfaces mobile lacks.
  On web, the mockup supplies the real values (`#FFFFFF`, `#F1EFE4`) — take those. Do not treat
  mobile's derived tints as canonical just because they're the ones written down in code.
- **Two conventions the backoffice has no home for.** There is no `constants/theme.ts` or
  `constants/ui.ts`, which is exactly why `SEVERITY_BADGE_CLASS` ended up inside a component,
  `RELATION_STATUS_CLASS` inside a route-local file, and `SELECT_CLASS` in eight places. Consolidating
  the status maps means deliberately moving against the repo's co-location rule
  (`docs/conventions.md:49-53`) and should be justified in writing as "design system" — plus a new
  convention line saying where such maps live. Mobile already articulated the correct split in
  `AlStatusBadge`'s KDoc: tone→color in the design system, status→(label, tone) in the feature layer.
- **Issue #58 bundles three separable jobs**: (1) the theme port, (2) the "Raíz" rename + new logo +
  missing favicon, (3) the dashboard/sidebar IA cleanup. Only (1) is what the mobile PR did. (2) and
  (3) are web-only additions and could reasonably ship as separate PRs.

---

## Historical Context

No `thoughts/` directory existed in the backoffice before this document. On the mobile side,
`thoughts/` contains 28 plans, 3 research docs, 3 stories and 21 ADRs — **and not one mentions the
palette, Raíz, or the fonts**. There is no plan or research doc for PR #42; `Palette.kt` was born
fully-formed in `c5b870c` (2026-08-22). The theme work bypassed that repo's usual
`thoughts/plans/` workflow, which is why the PR description and the `claude.md` diff are the only
written rationale that exists.

Also of note: `git log --all --diff-filter=D` on the backoffice surfaced `app/theme.tsx`, deleted in
`d2a9bbf feat: migrate to shadcn` — a pre-shadcn MUI-era file that predates the brand entirely and
contains nothing reusable.

---

## Open Questions

1. **The three-tier alert problem (§10).** `critical`/`high`/`medium` currently map to
   destructive/orange/amber; the palette has no orange. Which of options (a)/(b)/(c) does the
   design owner want? This blocks `AlertBadge.tsx`, `EstablishmentAlertBanner.tsx` and
   `SEVERITY_ROW_CLASS`.
2. **Dark mode: keep or delete?** The `.dark` block (33 lines) and every `dark:` utility are
   currently unreachable — no toggle exists anywhere. Mobile pinned dark off deliberately because
   the palette is light-only. Deleting is the consistent choice, but it's a one-way door if a
   toggle is planned.
3. **Cards: white or raised paper?** The mockup says `#FFFFFF`; mobile derived `#FDFBF4`. Same
   question for the table-header band (`#F1EFE4` mockup vs `#EDEADD` mobile). Recommendation: follow
   the mockup on web and note the divergence, since mobile's values are self-declared derived.
   Worth confirming against the Notion page.
4. **Corner radius.** Backoffice is on `--radius: 0.75rem`; mobile uses 4/8/16dp and the mockup's
   cards read closer to 8px. Does the spec pin a radius scale?
5. **The Notion page is unread.** `https://app.notion.com/p/Paleta-de-colores-y-referencias-39143152a11c80e4b60ff422a9731755`
   — the Notion connector is not authorized in this session. It may pin spacing, radii, elevation,
   iconography and the container tints that mobile had to derive. Worth reading before finalizing
   §8, since it could resolve questions 3 and 4 outright.
6. **Icons.** Mobile switched to **MingCute**; the backoffice uses **lucide-react**. Is icon
   unification in scope, or is lucide fine? Nothing in issue #58 mentions it.
7. **The new logo asset.** `03-logo-new.png` is a 954×1024 raster. Is there an SVG? A favicon and
   `app/icon.png` need creating either way — neither exists today.
8. **Naming.** Does "Raíz" replace "Ingeniería Para La Alimentación" everywhere (3 hardcoded sites),
   or does it become the product name alongside the organization name?
9. **Scope of the dashboard IA change.** `05-dashboard-proposal.png` is captioned "aca una idea" —
   an idea, not a spec. Confirm before building it, and consider splitting it out of the theme PR.
