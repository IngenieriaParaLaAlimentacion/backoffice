/**
 * Helpers for file downloads: reading the server-chosen filename off the
 * response and handing the blob to the browser.
 */

/**
 * Pulls the filename out of a `Content-Disposition` header.
 *
 * `filename*=UTF-8''...` wins over plain `filename=...` when both are present:
 * the extended form is the one that survives accents, and exports name the file
 * after user data (e.g. the establishment name).
 */
export function parseContentDispositionFilename(header: string | null) {
  if (!header) return null;

  const extended = header.match(/filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i);
  if (extended) {
    try {
      return decodeURIComponent(extended[2].trim());
    } catch {
      // A malformed percent-escape shouldn't lose the download; fall through
      // to the plain `filename` parameter below.
    }
  }

  const plain = header.match(/filename\s*=\s*("([^"]*)"|[^;]+)/i);
  if (plain) {
    const value = (plain[2] ?? plain[1]).trim();
    if (value) return value;
  }

  return null;
}

/** A CSV that arrived incomplete: the stream was cut before the last row. */
export class ExportTruncatedError extends Error {
  expected: number;
  received: number;

  constructor(expected: number, received: number) {
    super(`Se esperaban ${expected} filas y llegaron ${received}`);
    this.name = "ExportTruncatedError";
    this.expected = expected;
    this.received = received;
  }
}

/**
 * Counts the data rows of a CSV: every line but the header.
 *
 * Line counting is enough because the backend normalizes newlines inside
 * cells, so no row ever spans two lines. A file with only the header — a
 * filter matching nothing — counts as zero.
 */
export function countCsvDataRows(text: string) {
  const body = text.replace(/^﻿/, "").trim();
  if (!body) return 0;
  return body.split(/\r?\n/).length - 1;
}

/**
 * Checks the file against the row count the server declared.
 *
 * Exports are streamed: the `200` and its headers leave before the server
 * knows the query will finish, and a failure halfway through just cuts the
 * connection. Comparing what arrived against `X-Export-Row-Count` is what
 * keeps a truncated file from being saved as if it were whole.
 */
export async function assertCsvRowCount(blob: Blob, expected: number) {
  // Reading the text doesn't consume the blob; it can still be saved.
  const received = countCsvDataRows(await blob.text());
  if (received !== expected) throw new ExportTruncatedError(expected, received);
}

/** Saves a blob to disk under `filename` via a throwaway object URL. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
