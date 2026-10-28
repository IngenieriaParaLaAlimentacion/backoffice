import { matchesApiRequest } from "./api";
import { readFile, stat } from "node:fs/promises";
import { posix } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { expect, type Page } from "@playwright/test";
import {
  countCsvDataRows,
  parseContentDispositionFilename,
} from "../../lib/download";

async function xlsxRows(page: Page, bytes: Uint8Array): Promise<number> {
  const entries = unzipSync(bytes);
  const xml = (path: string): string => {
    const value = entries[path];
    if (!value) throw new Error(`Missing XLSX member: ${path}`);
    return strFromU8(value);
  };
  const target = await page.evaluate(
    ({ workbook, relationships }) => {
      const parse = (source: string): XMLDocument => {
        const document = new DOMParser().parseFromString(
          source,
          "application/xml",
        );
        if (document.querySelector("parsererror"))
          throw new Error("Invalid workbook XML");
        return document;
      };
      const book = parse(workbook);
      const sheet = Array.from(book.getElementsByTagNameNS("*", "sheet")).find(
        (element) => element.getAttribute("name") === "Respuestas",
      );
      if (!sheet) throw new Error("Missing Respuestas sheet");
      const id = sheet.getAttributeNS(
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
        "id",
      );
      const rel = Array.from(
        parse(relationships).getElementsByTagNameNS("*", "Relationship"),
      ).find((element) => element.getAttribute("Id") === id);
      const target = rel?.getAttribute("Target");
      if (!target || rel?.getAttribute("TargetMode") === "External") {
        throw new Error("Missing internal worksheet relationship");
      }
      return target;
    },
    {
      workbook: xml("xl/workbook.xml"),
      relationships: xml("xl/_rels/workbook.xml.rels"),
    },
  );
  const member = target.startsWith("/")
    ? posix.normalize(target.slice(1))
    : posix.normalize(posix.join("xl", target));
  if (!member.startsWith("xl/worksheets/"))
    throw new Error("Unexpected worksheet target");
  return page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, "application/xml");
    if (document.querySelector("parsererror"))
      throw new Error("Invalid worksheet XML");
    const data = document.getElementsByTagNameNS("*", "sheetData")[0];
    if (!data) throw new Error("Missing worksheet data");
    const rows = Array.from(data.children).filter(
      (element) => element.localName === "row",
    );
    if (rows.length < 1) throw new Error("Missing worksheet header");
    return rows.length - 1;
  }, xml(member));
}

export async function assertDownload(
  page: Page,
  opts: {
    path: string;
    click: () => Promise<void>;
    format: "csv" | "xlsx";
    expectedRows: number;
  },
): Promise<void> {
  expect(Number.isInteger(opts.expectedRows) && opts.expectedRows >= 0).toBe(
    true,
  );
  const expectedURL = new URL(opts.path, page.url());
  const responsePromise = page.waitForResponse((response) => {
    const actualURL = new URL(response.url());
    return (
      matchesApiRequest(response.request(), "GET", expectedURL.pathname) &&
      actualURL.origin === expectedURL.origin &&
      (!expectedURL.search || actualURL.search === expectedURL.search)
    );
  });
  const downloadPromise = page.waitForEvent("download");
  const [response, download] = await Promise.all([
    responsePromise,
    downloadPromise,
    opts.click(),
  ]);
  expect(response.status(), "real export response").toBe(200);
  const headers = await response.allHeaders();
  const filename = parseContentDispositionFilename(
    headers["content-disposition"] ?? null,
  );
  expect(filename, "server must declare an export filename").toBeTruthy();
  expect(download.suggestedFilename()).toBe(filename);
  expect(filename?.endsWith(`.${opts.format}`)).toBe(true);
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  expect(path, "real downloaded file must exist").toBeTruthy();
  if (!path) throw new Error("No downloaded file path");
  expect((await stat(path)).size).toBeGreaterThan(0);
  const file = await readFile(path);
  if (opts.format === "csv") {
    expect(headers["content-type"]).toContain("text/csv");
    const declared = headers["x-export-row-count"];
    expect(declared, "CSV declares row count").toMatch(/^\d+$/);
    const rows = countCsvDataRows(file.toString("utf8"));
    expect(rows).toBe(Number(declared));
    expect(rows).toBe(opts.expectedRows);
  } else {
    expect(headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(
      headers["x-export-row-count"],
      "current XLSX contract has no count header",
    ).toBeUndefined();
    expect(await xlsxRows(page, file)).toBe(opts.expectedRows);
  }
}
