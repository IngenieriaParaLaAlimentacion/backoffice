import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCsvExport } from "@/hooks/useCsvExport";
import { mockBlobDownload } from "@/test-utils";
import { downloadRequest } from "@/lib/http";
import { EXPORT } from "@/constants/exports";
import { ERROR_TYPES } from "@/lib/apiError";
import { SHARED_ERROR_MESSAGES } from "@/constants/errors";
import { SUBJECTS_EXPORT_ENDPOINT } from "@/constants/api";
import { server } from "@/mocks/server";
import { makeExportSubjectsHandler } from "@/mocks/handlers/csvExport";
import { baseHandler } from "@/mocks/handlers/base";

const fetchSubjectsCsv = () => downloadRequest(SUBJECTS_EXPORT_ENDPOINT);

describe("useCsvExport", () => {
  let download: ReturnType<typeof mockBlobDownload>;

  beforeEach(() => {
    download = mockBlobDownload();
  });

  it("saves the file under the name the server chose", async () => {
    const { result } = renderHook(() => useCsvExport());

    await act(async () => {
      await result.current.runExport(fetchSubjectsCsv, "fallback.csv");
    });

    expect(result.current.error).toBeNull();
    expect(download.createObjectURL).toHaveBeenCalledOnce();
    const csv = await (
      download.createObjectURL.mock.calls[0] as unknown as [Blob]
    )[0].text();
    expect(csv).toContain(
      "Nombre;Documento;Fecha de nacimiento;Edad;Último relevamiento;Tiempo desde el último relevamiento",
    );
    expect(download.click).toHaveBeenCalledOnce();
    expect(download.anchors()[0].download).toBe("sujetos_2026-08-24.csv");
  });

  it("saves an export with no rows: a header-only file is valid", async () => {
    server.use(makeExportSubjectsHandler({ rows: [] }));
    const { result } = renderHook(() => useCsvExport());

    await act(async () => {
      await result.current.runExport(fetchSubjectsCsv, "fallback.csv");
    });

    expect(result.current.error).toBeNull();
    expect(download.click).toHaveBeenCalledOnce();
  });

  it("refuses a file shorter than X-Export-Row-Count and saves nothing", async () => {
    // The stream was cut after the first row: the header still says 2.
    server.use(
      makeExportSubjectsHandler({
        rows: [
          "Ana Alvarez;20000001;14/03/2015;11a 5m;14/03/2026 07:30;hace 5 meses",
        ],
        declaredRowCount: 2,
      }),
    );
    const { result } = renderHook(() => useCsvExport());

    await act(async () => {
      await result.current.runExport(fetchSubjectsCsv, "fallback.csv");
    });

    await waitFor(() => expect(result.current.error).toBe(EXPORT.interrupted));
    expect(download.click).not.toHaveBeenCalled();
    expect(download.createObjectURL).not.toHaveBeenCalled();
    expect(result.current.isExporting).toBe(false);
  });

  it("translates an error that precedes the stream", async () => {
    server.use(
      baseHandler(SUBJECTS_EXPORT_ENDPOINT, {
        method: "get",
        status: 400,
        error: {
          type: ERROR_TYPES.INVALID_DATE_RANGE,
          detail: "birth_date_from must not be after birth_date_to",
        },
      }),
    );
    const { result } = renderHook(() => useCsvExport());

    await act(async () => {
      await result.current.runExport(fetchSubjectsCsv, "fallback.csv");
    });

    expect(result.current.error).toBe(
      SHARED_ERROR_MESSAGES[ERROR_TYPES.INVALID_DATE_RANGE],
    );
    expect(download.click).not.toHaveBeenCalled();
  });
});
