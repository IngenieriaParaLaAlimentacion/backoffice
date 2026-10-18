import { MEASUREMENTS_PAGE } from "@/constants/measurements";
import type { MeasurementListItem } from "@/types/measurement";

export default function MeasurementObservation({
  observation,
}: Pick<MeasurementListItem, "observation">) {
  return (
    <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
      {observation?.trim() ? observation : MEASUREMENTS_PAGE.noObservation}
    </p>
  );
}
