import { MEASUREMENTS_PAGE } from "@/constants/measurements";
import { cn } from "@/lib/utils";

type Props = {
  observation?: string | null;
  compact?: boolean;
};

export default function MeasurementObservation({
  observation,
  compact = true,
}: Props) {
  // Long reference strings without spaces must wrap instead of widening the table/card.
  // Lists show a three-line preview; the evolution panel exposes the complete note.
  return (
    <p
      className={cn(
        "whitespace-pre-wrap [overflow-wrap:anywhere]",
        compact && "line-clamp-3",
      )}
    >
      {observation?.trim() ? observation : MEASUREMENTS_PAGE.noObservation}
    </p>
  );
}
