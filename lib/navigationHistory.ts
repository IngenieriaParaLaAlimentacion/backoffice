const DEPTH_KEY = "__raizHistoryDepth";

function entryDepth(state: unknown): number {
  if (typeof state !== "object" || state === null) return 0;
  const depth = (state as Record<string, unknown>)[DEPTH_KEY];
  return typeof depth === "number" && Number.isSafeInteger(depth) && depth > 0
    ? depth
    : 0;
}

function withDepth(state: unknown, depth: number) {
  return {
    ...(typeof state === "object" && state !== null ? state : {}),
    [DEPTH_KEY]: depth,
  };
}

/** Whether this entry has a predecessor recorded by this app. */
export function hasPreviousAppEntry(): boolean {
  return entryDepth(window.history.state) > 0;
}

/** Track app entries while preserving the router's own history state. */
export function trackAppHistory(): () => void {
  const history = window.history;
  const { pushState, replaceState } = history;

  replaceState.call(
    history,
    withDepth(history.state, entryDepth(history.state)),
    "",
  );

  const trackedPush: History["pushState"] = function (
    this: History,
    data,
    unused,
    url,
  ) {
    pushState.call(
      this,
      withDepth(data, entryDepth(this.state) + 1),
      unused,
      url,
    );
  };
  const trackedReplace: History["replaceState"] = function (
    this: History,
    data,
    unused,
    url,
  ) {
    replaceState.call(
      this,
      withDepth(data, entryDepth(this.state)),
      unused,
      url,
    );
  };

  // Next.js also wraps these methods. Compose with those wrappers and keep
  // their state members, including the router tree used by back/forward.
  history.pushState = trackedPush;
  history.replaceState = trackedReplace;

  return () => {
    if (history.pushState === trackedPush) history.pushState = pushState;
    if (history.replaceState === trackedReplace)
      history.replaceState = replaceState;
  };
}
