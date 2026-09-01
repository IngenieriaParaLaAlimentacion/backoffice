"use client";

import { useEffect, useState } from "react";

type MswProviderProps = {
  children: React.ReactNode;
};

const shouldEnableMsw = process.env.NEXT_PUBLIC_ENABLE_MSW === "true";

/**
 * Module-scoped so the worker starts exactly once per page load. React's
 * StrictMode runs effects twice in dev, and a second `worker.start()` throws
 * ("cannot configure an already enabled network") — memoizing the promise
 * makes the repeat call await the first start instead of racing it.
 */
let startPromise: Promise<unknown> | null = null;

function startWorker() {
  startPromise ??= import("@/mocks/browser").then(({ worker }) =>
    worker.start({ onUnhandledRequest: "bypass" }),
  );
  return startPromise;
}

export default function MswProvider({ children }: MswProviderProps) {
  const [isReady, setIsReady] = useState(!shouldEnableMsw);

  useEffect(() => {
    if (!shouldEnableMsw) {
      return;
    }

    let isMounted = true;

    startWorker()
      .then(() => {
        if (isMounted) setIsReady(true);
      })
      // Without this the failure surfaces as an unhandledRejection instead of
      // saying which part of the mock setup broke.
      .catch((error) => {
        console.error("[msw] failed to start the mock worker", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
