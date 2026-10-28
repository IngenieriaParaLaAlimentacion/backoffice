import { http, HttpResponse, PathParams } from "msw";
import { SUBJECTS_EXPORT_ENDPOINT } from "@/constants/api";

export type CsvExportOptions = {
  /** Data rows the file actually carries. */
  rows?: string[];
  /**
   * What `X-Export-Row-Count` announces. Defaults to `rows.length`; set it
   * higher to stand in for a stream the server cut halfway through.
   */
  declaredRowCount?: number;
  filename?: string;
};

const HEADER_LINE =
  "Nombre;Documento;Fecha de nacimiento;Edad;Último relevamiento;Tiempo desde el último relevamiento";

const DEFAULT_ROWS = [
  "Ana Alvarez;20000001;14/03/2015;11 a 5 m;14/03/2026 07:30;hace 5 meses",
  "Beto Benitez;20000002;01/07/2016;10 a 1 m;01/04/2026 07:00;hace 4 meses",
];

/**
 * A CSV export as the backend streams it: BOM, CRLF, `;` delimiter, and the
 * row count in a header.
 */
export function makeExportSubjectsHandler(options?: CsvExportOptions) {
  const rows = options?.rows ?? DEFAULT_ROWS;
  const filename = options?.filename ?? "sujetos_2026-08-24.csv";
  const declared = options?.declaredRowCount ?? rows.length;

  return http.get<PathParams>(SUBJECTS_EXPORT_ENDPOINT, () => {
    const body = `﻿${[HEADER_LINE, ...rows].join("\r\n")}\r\n`;
    return new HttpResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Row-Count": String(declared),
      },
    });
  });
}
