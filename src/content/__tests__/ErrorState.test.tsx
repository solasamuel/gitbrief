import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorState from "@/content/sidebar/components/ErrorState";

describe("T-028: ErrorState shows retry button and settings link for key errors", () => {
  it("displays the error message", () => {
    render(<ErrorState message="Something went wrong" onRetry={() => {}} />);
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("has role=alert for accessibility", () => {
    render(<ErrorState message="Error" onRetry={() => {}} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders a retry button that calls onRetry", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState message="Error" onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows settings link when error code is CLAUDE_ERROR", () => {
    render(<ErrorState message="Invalid API key" code="CLAUDE_ERROR" onRetry={() => {}} />);
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it("does not show settings link for GITHUB_ERROR", () => {
    render(<ErrorState message="Not found" code="GITHUB_ERROR" onRetry={() => {}} />);
    expect(screen.queryByText(/settings/i)).toBeNull();
  });
});
