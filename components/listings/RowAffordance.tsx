"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared classes for a clickable desktop table row (`<tr>`). Combine with
 * `rowStateClass` for the row's background.
 */
export const ROW_HOVER_CLASS =
  "group cursor-pointer transition-colors hover:bg-muted/70";

/**
 * Shared classes for a clickable mobile card (`<button>`, `<Link>` or
 * `<div onClick>`). Combine with `rowStateClass` for the card's background.
 */
export const CARD_HOVER_CLASS =
  "group cursor-pointer transition-colors hover:bg-muted/70 active:bg-muted/70";

/** Row/card background: selected takes priority, then an optional severity
 * tint (e.g. `SEVERITY_ROW_CLASS[severity]`), falling back to `bg-card`. */
export function rowStateClass(isSelected: boolean, severityClass?: string) {
  return isSelected ? "bg-muted/40" : (severityClass ?? "bg-card");
}

/** Empty header cell pairing with `ChevronCell` in a desktop table. */
export function ChevronHeaderCell({ className }: { className?: string }) {
  return (
    <th className={cn("px-4 py-3 font-medium", className)}>
      <span className="sr-only">Ver detalle</span>
    </th>
  );
}

/** Trailing `<td>` with the chevron affordance for a desktop table row. */
export function ChevronCell({ className }: { className?: string }) {
  return (
    <td className={cn("px-4 py-3", className)}>
      <RowChevron />
    </td>
  );
}

/** Bare chevron icon — use directly in mobile cards, outside a `<td>`. */
export function RowChevron({ className }: { className?: string }) {
  return (
    <ChevronRight
      size={16}
      className={cn(
        "text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground",
        className,
      )}
    />
  );
}

/** Underlines its content when the ancestor `group` row/card is hovered. */
export function RowLink({ children }: { children: React.ReactNode }) {
  return <span className="group-hover:underline">{children}</span>;
}

/** Same effect as `RowLink`, as a class to merge into an element (e.g. a
 * `next/link`) that already needs its own `className`. */
export const GROUP_HOVER_UNDERLINE = "group-hover:underline";
