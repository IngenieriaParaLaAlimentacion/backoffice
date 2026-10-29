import { Button } from "@/components/ui/button";
import { NUTRITION_REPORT_SHARED_COPY } from "@/constants/nutritionReport";
import NutritionReportBanner from "./NutritionReportBanner";

/** The error banner of a failed load, with the button to try again. */
export default function NutritionReportLoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <NutritionReportBanner tone="danger" className="w-full">
        {message}
      </NutritionReportBanner>
      <Button size="sm" variant="outline" onClick={onRetry}>
        {NUTRITION_REPORT_SHARED_COPY.retry}
      </Button>
    </div>
  );
}
