import { useRouter } from "next/navigation";

/**
 * "Volver" that steps back in the browser history. Pushing the previous screen
 * instead would stack it on top of this one, so the next "Volver" up the chain
 * (router.back()) would land here again: a loop. On a deep link there is
 * nothing to step back to, so it opens `fallbackHref`.
 */
export function useGoBack(fallbackHref: string) {
  const router = useRouter();

  return () => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };
}
