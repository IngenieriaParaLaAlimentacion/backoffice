/**
 * Error that preserves the HTTP status so callers can branch (e.g. 404 vs 409),
 * plus the RFC 7807 `type` for the cases where one status covers several
 * failures (a 409 is both "duplicate name" and "survey locked").
 */
export class ApiError extends Error {
  status: number;
  type?: string;
  constructor(message: string, status: number, type?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.type = type;
  }
}

/** RFC 7807 `type` of the 409 raised when editing a survey that has responses. */
export const SURVEY_LOCKED_ERROR_TYPE = "/errors/survey-locked";
