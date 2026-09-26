"use client";

import { List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ESTABLISHMENTS_LIST_PAGE } from "@/constants/establishments";

export type EstablishmentsView = "list" | "map";

const COPY = ESTABLISHMENTS_LIST_PAGE.viewToggle;

const OPTIONS = [
  { value: "list", label: COPY.list, Icon: List },
  { value: "map", label: COPY.map, Icon: MapIcon },
] as const;

/** Two views of the same establishments: the table and the map. */
export function ViewToggle({
  view,
  onChange,
}: {
  view: EstablishmentsView;
  onChange: (view: EstablishmentsView) => void;
}) {
  return (
    <div
      role="group"
      aria-label={COPY.label}
      className="inline-flex gap-0.5 rounded-lg border border-border p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <Button
          key={value}
          size="sm"
          variant={view === value ? "secondary" : "ghost"}
          aria-pressed={view === value}
          onClick={() => onChange(value)}
        >
          <Icon size={14} />
          {label}
        </Button>
      ))}
    </div>
  );
}
