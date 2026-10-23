import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { PASSWORD_REQUIREMENTS } from "@/schemas/password.schema";

describe("PasswordRequirements", () => {
  it("renders all five password requirements", () => {
    render(<PasswordRequirements password="" />);

    for (const req of PASSWORD_REQUIREMENTS) {
      expect(screen.getByText(req.label)).toBeInTheDocument();
      const item = screen.getByTestId(`req-${req.id}`);
      expect(item).toHaveAttribute("data-met", "false");
    }
  });

  it("dynamically reflects met requirements as password satisfies them", () => {
    const { rerender } = render(<PasswordRequirements password="abc" />);

    // lowercase met, others not met
    expect(screen.getByTestId("req-lowercase")).toHaveAttribute(
      "data-met",
      "true",
    );
    expect(screen.getByTestId("req-uppercase")).toHaveAttribute(
      "data-met",
      "false",
    );
    expect(screen.getByTestId("req-length")).toHaveAttribute(
      "data-met",
      "false",
    );
    expect(screen.getByTestId("req-number")).toHaveAttribute(
      "data-met",
      "false",
    );
    expect(screen.getByTestId("req-special")).toHaveAttribute(
      "data-met",
      "false",
    );

    // add uppercase
    rerender(<PasswordRequirements password="abcDEF" />);
    expect(screen.getByTestId("req-lowercase")).toHaveAttribute(
      "data-met",
      "true",
    );
    expect(screen.getByTestId("req-uppercase")).toHaveAttribute(
      "data-met",
      "true",
    );
    expect(screen.getByTestId("req-length")).toHaveAttribute(
      "data-met",
      "false",
    );

    // add length >= 8
    rerender(<PasswordRequirements password="abcdefgh" />);
    expect(screen.getByTestId("req-length")).toHaveAttribute(
      "data-met",
      "true",
    );

    // add number
    rerender(<PasswordRequirements password="12345" />);
    expect(screen.getByTestId("req-number")).toHaveAttribute(
      "data-met",
      "true",
    );

    // add special char
    rerender(<PasswordRequirements password="!@#" />);
    expect(screen.getByTestId("req-special")).toHaveAttribute(
      "data-met",
      "true",
    );
  });

  it("marks all requirements as met for a fully compliant password", () => {
    render(<PasswordRequirements password="CompliantPassword123!" />);

    for (const req of PASSWORD_REQUIREMENTS) {
      const item = screen.getByTestId(`req-${req.id}`);
      expect(item).toHaveAttribute("data-met", "true");
    }
  });
});
