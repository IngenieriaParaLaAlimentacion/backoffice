import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCsvExport } from "@/hooks/useCsvExport";
import { downloadRequest } from "@/lib/http";
import { EXPORT } from "@/constants/exports";
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
        rows: ["Ana Alvarez;20000001;14/03/2015;14/03/2026 07:30"],
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

  it("shows the server's message on an error that precedes the stream", async () => {
    server.use(
      baseHandler(SUBJECTS_EXPORT_ENDPOINT, {
        method: "get",
        status: 400,
        error: { detail: "birth_date_from no puede ser mayor a birth_date_to" },
      }),
    );
    const { result } = renderHook(() => useCsvExport());

    await act(async () => {
      await result.current.runExport(fetchSubjectsCsv, "fallback.csv");
    });

    expect(result.current.error).toBe(
      "birth_date_from no puede ser mayor a birth_date_to",
    );
    expect(click).not.toHaveBeenCalled();
  });
});
