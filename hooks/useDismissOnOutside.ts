import { useEffect, useRef } from "react";

/**
 * Dismisses an open popup the way a native `<select>` does: a mousedown
 * anywhere outside it, or Escape. Returns the ref to attach to whatever counts
 * as "inside" — the trigger and the popup together, since a click on either
 * must not be read as a dismissal.
 *
 * `onDismiss` is read through a ref so that an inline arrow at the call site
 * doesn't resubscribe both document listeners on every render.
 */
export function useDismissOnOutside<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onDismiss: () => void,
) {
  const containerRef = useRef<T>(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node))
        onDismissRef.current();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismissRef.current();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return containerRef;
}
