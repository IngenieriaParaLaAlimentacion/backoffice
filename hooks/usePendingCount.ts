import { useCallback, useState } from "react";

/** Tracks a single "how many pending" indicator count; null on fetch error. */
export function usePendingCount(fetchCount: () => Promise<number>) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setCount(await fetchCount());
    } catch {
      setCount(null);
    } finally {
      setLoading(false);
    }
  }, [fetchCount]);

  return { count, loading, fetch };
}
