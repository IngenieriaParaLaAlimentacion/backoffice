"use client";

import { useEffect, useState } from "react";

/** Sample time when display data changes and the window regains focus. */
export function useRenderClock(displayData: unknown) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setNow(new Date());
  }, [displayData]);
  useEffect(() => {
    const onFocus = () => setNow(new Date());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  return now;
}
