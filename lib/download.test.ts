import { describe, expect, it } from "vitest";
import {
  assertCsvRowCount,
  countCsvDataRows,
  ExportTruncatedError,
} from "@/lib/download";

const HEADER =
  "Nombre;Documento;Fecha de nacimiento;Edad;Último relevamiento;Tiempo desde el último relevamiento";
const ROW_A =
  "Ana Alvarez;20000001;14/03/2015;11a 5m;14/03/2026 07:30;hace 5 meses";
const ROW_B =
  "Beto Benitez;20000002;01/07/2016;10a 1m;01/04/2026 07:00;hace 4 meses";

describe("countCsvDataRows", () => {
  it("does not count the header", () => {
    expect(countCsvDataRows(`${HEADER}\r\n${ROW_A}\r\n${ROW_B}`)).toBe(2);
  });

  it("ignores the UTF-8 BOM the backend prepends for Excel", () => {
    expect(countCsvDataRows(`﻿${HEADER}\r\n${ROW_A}`)).toBe(1);
  });

  it("ignores the trailing newline", () => {
    expect(countCsvDataRows(`${HEADER}\r\n${ROW_A}\r\n`)).toBe(1);
  });

  it("accepts LF as well as CRLF", () => {
    expect(countCsvDataRows(`${HEADER}\n${ROW_A}\n${ROW_B}`)).toBe(2);
  });

  it("counts a header-only file as zero rows", () => {
    expect(countCsvDataRows(`﻿${HEADER}\r\n`)).toBe(0);
  });

  it("counts an empty file as zero rows", () => {
    expect(countCsvDataRows("")).toBe(0);
  });
});

describe("assertCsvRowCount", () => {
  const blobOf = (text: string) => new Blob([text], { type: "text/csv" });

  it("passes when the file carries what the server declared", async () => {
    await expect(
      assertCsvRowCount(blobOf(`${HEADER}\r\n${ROW_A}\r\n${ROW_B}\r\n`), 2),
    ).resolves.toBeUndefined();
  });

  it("passes on an empty export declared as zero rows", async () => {
    await expect(
      assertCsvRowCount(blobOf(`${HEADER}\r\n`), 0),
    ).resolves.toBeUndefined();
  });

  it("rejects when the stream was cut short", async () => {
    const promise = assertCsvRowCount(blobOf(`${HEADER}\r\n${ROW_A}\r\n`), 2);
    await expect(promise).rejects.toBeInstanceOf(ExportTruncatedError);
    await expect(promise).rejects.toMatchObject({ expected: 2, received: 1 });
  });
});
