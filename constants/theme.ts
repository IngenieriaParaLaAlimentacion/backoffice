/**
 * The design-system layer of the "Raíz" theme: the tone → color mapping, and
 * nothing else.
 *
 * This file deliberately sits outside the co-location rule the rest of the repo
 * follows (`docs/conventions.md`). The same four status tones were previously
 * spelled out in four places with four sets of opacities; a tone map is a
 * design decision, not screen copy, so it lives once. What stays in the feature
 * layer is the *other* half: which domain status maps to which tone, and what
 * it is called in Spanish (`constants/establishments.ts`, `AlertBadge.tsx`, …).
 *
 * Every class here resolves through a token in `app/globals.css`. Do not add a
 * raw Tailwind palette color — the palette has no orange, no emerald and no
 * amber, and reaching for one is what this file exists to prevent.
 */

/**
 * `critical` and `danger` share the brick hue and differ in weight. That is a
 * constraint of the palette, not an oversight: the spec has exactly two alert
 * hues (ladrillo, mostaza) and the app has three severity tiers, so the third
 * tier is expressed as a solid fill rather than an invented third hue.
 */
export type Tone = "critical" | "danger" | "warning" | "success" | "neutral";

/** Shape of a status pill/badge — pair with a `TONE_PILL_CLASS` entry. */
export const PILL_CLASS =
  "inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs text-center";

export const TONE_PILL_CLASS: Record<Tone, string> = {
  critical: "border-destructive bg-destructive text-destructive-foreground",
  danger: "border-destructive/30 bg-destructive-container text-destructive",
  warning: "border-warning/30 bg-warning-container text-warning",
  success: "border-success/30 bg-success-container text-success",
  neutral: "border-border bg-muted text-muted-foreground",
};

/** Full-width callout: border + tinted fill + text, for banners and toasts. */
export const TONE_BANNER_CLASS: Record<Tone, string> = {
  critical: "border-destructive bg-destructive-container text-destructive",
  danger: "border-destructive/30 bg-destructive-container/60 text-destructive",
  warning: "border-warning/30 bg-warning-container text-warning",
  success: "border-success/30 bg-success-container text-success",
  neutral: "border-border bg-muted text-muted-foreground",
};

/**
 * Background-only tint for a table row or card carrying a status. Kept much
 * fainter than the pill: it sits under body text, which has to stay at
 * ink-on-paper contrast.
 */
export const TONE_ROW_CLASS: Record<Tone, string> = {
  critical: "bg-destructive/8",
  danger: "bg-destructive/5",
  warning: "bg-warning/5",
  success: "bg-success/5",
  neutral: "bg-card",
};

/**
 * Shape of a map pin: a 28px disc with a paper halo, so it stays legible over
 * the grey base map. Pair with a `TONE_PIN_CLASS` entry.
 */
export const PIN_CLASS =
  "flex size-7 items-center justify-center rounded-full border-2 font-mono text-[11px] font-bold leading-none tracking-tighter ring-2 ring-card shadow-md";

/**
 * A pin needs more body than a pill: the tinted containers that read well
 * under text vanish over a map, so every tone gets a solid border. `critical`
 * is the only fully solid brick; `danger` shares its hue and is told apart by
 * weight (and, on the map, by its symbol). `neutral` is hollow and dashed on
 * purpose — "no data" must never look like a result.
 */
export const TONE_PIN_CLASS: Record<Tone, string> = {
  critical: "border-destructive bg-destructive text-destructive-foreground",
  danger: "border-destructive bg-destructive-container text-destructive",
  warning: "border-warning bg-warning-container text-warning",
  success: "border-success bg-success text-card",
  neutral:
    "border-dashed border-muted-foreground bg-card text-muted-foreground",
};

/**
 * A cluster is a count, not a status: earth-dark, so it can't be mistaken for
 * any severity (the palette's brick, mustard and sage all mean something).
 */
export const CLUSTER_PIN_CLASS =
  "flex items-center justify-center rounded-full bg-chart-5 font-mono font-bold text-card ring-2 ring-card shadow-md";

/**
 * Stacking of the map's own overlays (its legend). Leaflet lays its controls
 * at z-index 1000 inside the map's `isolate` box, so overlays we add there
 * need to sit at the same level to stay above the tiles and pins.
 */
export const MAP_OVERLAY_CLASS = "z-1000";

/** Scrim behind every dialog and drawer. Warm ink, never black. */
export const OVERLAY_CLASS = "bg-overlay/45";

/**
 * Numbers read as data — counters, measurements, stamped dates — take the mono
 * role. Numbers inside a sentence do not.
 */
export const DATA_CLASS = "font-mono";
