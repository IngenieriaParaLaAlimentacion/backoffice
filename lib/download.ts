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
