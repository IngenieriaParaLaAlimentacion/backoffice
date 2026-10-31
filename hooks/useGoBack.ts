import { useRouter } from "next/navigation";
import { hasPreviousAppEntry } from "@/lib/navigationHistory";

/**
 * "Volver" that steps back in the browser history. Pushing the previous screen
 * instead would stack it on top of this one, so the next "Volver" up the chain
 * (router.back()) would land here again: a loop. On a deep link there is
 * nothing to step back to, so it replaces the entry with `fallbackHref`.
 */
export function useGoBack(fallbackHref: string) {
  const router = useRouter();

  return () => {
    if (hasPreviousAppEntry()) router.back();
    else router.replace(fallbackHref);
  };
}
