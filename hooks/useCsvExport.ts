import { useCallback, useState } from "react";
import { DownloadedFile } from "@/lib/http";
import { saveBlob } from "@/lib/download";
import { EXPORT } from "@/constants/exports";

/**
 * Drives an export button: one in-flight flag, one error message, and the
 * hand-off of the downloaded file to the browser. The server names the file
 * via `Content-Disposition`; `fallbackFilename` only covers its absence.
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
        const { blob, filename } = await fetchFile();
        saveBlob(blob, filename ?? fallbackFilename);
      } catch (err) {
        setError(err instanceof Error ? err.message : EXPORT.error);
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { isExporting, error, clearError, runExport };
}
