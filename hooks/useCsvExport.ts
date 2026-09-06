import { useCallback, useState } from "react";
import { DownloadedFile } from "@/lib/http";
import { assertCsvRowCount, saveBlob } from "@/lib/download";
import { ApiError } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";
import { EXPORT } from "@/constants/exports";

/**
 * Drives an export button: one in-flight flag, one error message, and the
 * hand-off of the downloaded file to the browser. The server names the file
 * via `Content-Disposition`; `fallbackFilename` only covers its absence.
 *
 * Nothing reaches disk before the file is checked against the row count the
 * server declared, so a stream cut halfway never saves a partial CSV.
 */
export function useCsvExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const runExport = useCallback(
    async (
      fetchFile: () => Promise<DownloadedFile>,
      fallbackFilename: string,
    ) => {
      setIsExporting(true);
      setError(null);
      try {
        const { blob, filename, rowCount } = await fetchFile();
        if (rowCount !== null) await assertCsvRowCount(blob, rowCount);
        saveBlob(blob, filename ?? fallbackFilename);
      } catch (err) {
        // 400/403/404 arrive before the first byte, with a problem+json whose
        // `type` we can translate. Anything else means the download broke
        // mid-stream.
        if (err instanceof ApiError)
          setError(getErrorMessage(err, { fallback: EXPORT.error }));
        else setError(EXPORT.interrupted);
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { isExporting, error, clearError, runExport };
}
