import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MeasurementObservation from "./MeasurementObservation";
import { MEASUREMENTS_PAGE } from "@/constants/measurements";

describe("MeasurementObservation", () => {
  it("renders the complete multiline observation as plain text", () => {
    const observation = "Primera medición.\n<script>alert('hola')</script>";
    const { container } = render(
      <MeasurementObservation observation={observation} />,
    );

    const note = container.querySelector("p");
    expect(note?.textContent).toBe(observation);
    expect(note).toHaveClass("whitespace-pre-wrap", "[overflow-wrap:anywhere]");
    expect(container.querySelector("script")).toBeNull();
  });

  it.each([null, undefined, "", "   "])(
    "shows the empty placeholder for %s observations",
    (observation) => {
      render(<MeasurementObservation observation={observation} />);
      expect(
        screen.getByText(MEASUREMENTS_PAGE.noObservation),
      ).toBeInTheDocument();
    },
  );
});
