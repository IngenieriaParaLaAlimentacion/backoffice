import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { downloadNutritionReportPdfAction } from "@/services/nutritionReport.service";
import { ReportMonth } from "@/types/nutritionReport";
import { ApiError } from "@/lib/apiError";
import { saveBlob } from "@/lib/download";
import { getNutritionReportErrorMessage } from "@/lib/nutritionReportErrors";
import {
  NUTRITION_REPORT_FALLBACK_ERROR,
  NUTRITION_REPORT_PDF_FALLBACK_FILENAME,
} from "@/constants/nutritionReport";

/**
 * Downloads a saved report as a PDF, named by the server. It never generates
 * a report or spends AI quota, so it is safe to offer next to any saved one.
 */
export function useNutritionReportPdf(establishmentId: string) {
  const { makeAuthorizedDownload } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const download = useCallback(
    async (month: ReportMonth) => {
      setIsDownloading(true);
      setError(null);
      try {
        const { blob, filename } = await downloadNutritionReportPdfAction(
          makeAuthorizedDownload,
          establishmentId,
          month,
        );
        saveBlob(
          blob,
          filename ?? NUTRITION_REPORT_PDF_FALLBACK_FILENAME(month),
        );
      } catch (err) {
        setError(
          err instanceof ApiError
            ? getNutritionReportErrorMessage(err)
            : NUTRITION_REPORT_FALLBACK_ERROR,
        );
      } finally {
        setIsDownloading(false);
      }
    },
    [makeAuthorizedDownload, establishmentId],
  );

  return { isDownloading, error, clearError, download };
}
