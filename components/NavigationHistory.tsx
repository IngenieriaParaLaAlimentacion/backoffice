"use client";

import { useEffect } from "react";
import { trackAppHistory } from "@/lib/navigationHistory";

/** Records navigation from the app's first screen, including list pages. */
export default function NavigationHistory() {
  useEffect(trackAppHistory, []);
  return null;
}
