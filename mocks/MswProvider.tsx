"use client";

import { useEffect, useState } from "react";

type MswProviderProps = {
  children: React.ReactNode;
};

const shouldEnableMsw = process.env.NEXT_PUBLIC_ENABLE_MSW === "true";

export default function MswProvider({ children }: MswProviderProps) {
  const [isReady, setIsReady] = useState(!shouldEnableMsw);

  useEffect(() => {
    if (!shouldEnableMsw) {
      return;
    }

    let isMounted = true;

    async function enableMocking() {
      const { worker } = await import("@/mocks/browser");
      await worker.start({ onUnhandledRequest: "bypass" });

      if (isMounted) {
        setIsReady(true);
      }
    }

    void enableMocking();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
