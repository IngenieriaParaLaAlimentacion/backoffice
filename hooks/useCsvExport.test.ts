import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCsvExport } from "@/hooks/useCsvExport";
import { downloadRequest } from "@/lib/http";
import { EXPORT } from "@/constants/exports";
import { ERROR_TYPES } from "@/lib/apiError";
import { SHARED_ERROR_MESSAGES } from "@/constants/errors";
import { SUBJECTS_EXPORT_ENDPOINT } from "@/constants/api";
import { server } from "@/mocks/server";
import { makeExportSubjectsHandler } from "@/mocks/handlers/csvExport";
import { baseHandler } from "@/mocks/handlers/base";

const fetchSubjectsCsv = () => downloadRequest(SUBJECTS_EXPORT_ENDPOINT);

/**
 * jsdom implements neither, and `saveBlob` needs both. Patch the two statics
 * rather than the `URL` global: MSW builds `new URL(...)` on every request.
 */
function stubObjectUrl() {
  const createObjectURL = vi.fn(() => "blob:mock");
  const revokeObjectURL = vi.fn();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  return { createObjectURL, revokeObjectURL };
}

describe("useCsvExport", () => {
  let objectUrl: ReturnType<typeof stubObjectUrl>;
  let click: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    objectUrl = stubObjectUrl();
    click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
    vi.restoreAllMocks();
  });

  it("saves the file under the name the server chose", async () => {
    const { result } = renderHook(() => useCsvExport());

    await act(async () => {
      await result.current.runExport(fetchSubjectsCsv, "fallback.csv");
    });

    expect(result.current.error).toBeNull();
    expect(objectUrl.createObjectURL).toHaveBeenCalledOnce();
    const csv = await (
      objectUrl.createObjectURL.mock.calls[0] as unknown as [Blob]
    )[0].text();
    expect(csv).toContain(
      "Nombre;Documento;Fecha de nacimiento;Edad;Último relevamiento;Tiempo desde el último relevamiento",
    );
    expect(click).toHaveBeenCalledOnce();
    const anchor = click.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("sujetos_2026-08-24.csv");
  });

  it("saves an export with no rows: a header-only file is valid", async () => {
    server.use(makeExportSubjectsHandler({ rows: [] }));
    const { result } = renderHook(() => useCsvExport());

    await act(async () => {
      await result.current.runExport(fetchSubjectsCsv, "fallback.csv");
    });

    expect(result.current.error).toBeNull();
    expect(click).toHaveBeenCalledOnce();
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
    expect(click).not.toHaveBeenCalled();
    expect(objectUrl.createObjectURL).not.toHaveBeenCalled();
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
    expect(click).not.toHaveBeenCalled();
  });
});
