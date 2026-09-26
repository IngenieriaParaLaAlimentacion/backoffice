import { mutate, type SWRConfiguration } from "swr";

/**
 * How long a response is reused instead of asking the backend again. The
 * back-office is used by few people and its data changes slowly, so half a
 * minute is enough to make switching views feel instant without showing
 * anything noticeably old.
 */
export const SWR_DEDUPING_INTERVAL_MS = 30_000;

/**
 * Shared by every SWR hook. `keepPreviousData` keeps the last result on screen
 * while a new one loads; `revalidateOnFocus` is off so coming back to the tab
 * doesn't refetch on its own.
 */
export const SWR_CONFIG = {
  keepPreviousData: true,
  revalidateOnFocus: false,
  dedupingInterval: SWR_DEDUPING_INTERVAL_MS,
} as const satisfies SWRConfiguration;

/**
 * SWR's cache is one per browser tab and outlives the session, so whoever signs
 * in next would be shown the previous user's data until it expired. Call it
 * right before a session starts, when no screen with data is mounted.
 *
 * It has to revalidate (`revalidate` defaults to true): that is what also
 * forgets "this key was fetched a moment ago". Skipping it leaves the data
 * gone but the request still deduped, so the next screen would show nothing
 * and never ask again until the window ends.
 */
export const clearSwrCache = () => mutate(() => true, undefined);
