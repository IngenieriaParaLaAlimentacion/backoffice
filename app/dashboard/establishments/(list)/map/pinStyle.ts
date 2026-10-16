import { cn } from "@/lib/utils";
import { PIN_STATUS_TONE } from "@/constants/establishments";
import { PIN_CLASS, TONE_PIN_CLASS } from "@/constants/theme";
import type { PinStatus } from "@/lib/establishmentPins";

/** One pin look, shared by the legend and by the marker on the map. */
export const pinClassName = (status: PinStatus) =>
  cn(PIN_CLASS, TONE_PIN_CLASS[PIN_STATUS_TONE[status]]);
