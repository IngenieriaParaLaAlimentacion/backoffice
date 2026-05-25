"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;

    //router.replace(isAuthenticated ? "/dashboard" : "/signin");
    router.replace("/dashboard");
  }, [isAuthenticated, isInitializing, router]);

  return null;
}
