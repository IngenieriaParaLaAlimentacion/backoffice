import { beforeEach, describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { hasPreviousAppEntry, trackAppHistory } from "./navigationHistory";

describe("app history tracking", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/initial");
  });

  it("preserves Next state and does not count tab replacements as new entries", async () => {
    const stop = trackAppHistory();
    try {
      const routerState = { __NA: true, tree: ["dashboard"] };
      window.history.pushState(routerState, "", "/establishment");
      expect(window.history.state).toMatchObject(routerState);
      window.history.replaceState(routerState, "", "/establishment/stock");
      expect(window.history.state).toMatchObject(routerState);
      expect(hasPreviousAppEntry()).toBe(true);

      window.history.back();
      await waitFor(() => expect(window.location.pathname).toBe("/initial"));
      expect(hasPreviousAppEntry()).toBe(false);

      window.history.forward();
      await waitFor(() =>
        expect(window.location.pathname).toBe("/establishment/stock"),
      );
      expect(hasPreviousAppEntry()).toBe(true);
    } finally {
      stop();
    }
  });

  it("retains the position across a reload or StrictMode remount", () => {
    let stop = trackAppHistory();
    try {
      window.history.pushState({}, "", "/detail");
      stop();
      stop = trackAppHistory();

      expect(hasPreviousAppEntry()).toBe(true);
    } finally {
      stop();
    }
  });
});
