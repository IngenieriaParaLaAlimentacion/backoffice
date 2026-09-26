import {
  ESTABLISHMENTS_MAP_PAGE,
  PIN_STATUS_LABELS,
  PIN_STATUS_SYMBOL,
} from "@/constants/establishments";
import { DATA_CLASS, MAP_OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";
import {
  countPinsByStatus,
  MapPin,
  PIN_STATUSES,
} from "@/lib/establishmentPins";
import { pinClassName } from "./pinStyle";

/**
 * Explains the pins and counts them. The counts matter as much as the key: they
 * are where "how many establishments have no data yet" becomes visible.
 */
export default function MapLegend({ pins }: { pins: MapPin[] }) {
  const counts = countPinsByStatus(pins);

  return (
    <div
      className={cn(
        "absolute bottom-3 left-3 rounded-lg border border-border bg-card/95 p-3 shadow-md",
        MAP_OVERLAY_CLASS,
      )}
    >
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {ESTABLISHMENTS_MAP_PAGE.legendTitle}
      </p>
      <ul className="flex flex-col gap-1.5">
        {PIN_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-2 text-sm">
            <span aria-hidden className={pinClassName(status)}>
              {PIN_STATUS_SYMBOL[status]}
            </span>
            <span>{PIN_STATUS_LABELS[status]}</span>
            <span
              className={`ml-auto pl-3 text-xs text-muted-foreground ${DATA_CLASS}`}
            >
              {counts[status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
