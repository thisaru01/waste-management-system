import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import CollectorScanBin from "../CollectorScanBin.jsx";
import { renderWithProviders } from "../../test/testUtils.jsx";
import { server } from "../../test/testServer.js";
import { http, HttpResponse } from "msw";

// Seed a fake logged-in collector
beforeEach(() => {
  localStorage.setItem(
    "user",
    JSON.stringify({
      _id: "collector-1",
      firstName: "Casey",
      lastName: "Collector",
      roles: [{ name: "collector" }],
    })
  );
  localStorage.setItem("token", "test-token");
  // Clear any persisted active session between tests
  localStorage.removeItem("activeBinSession");
});

describe("CollectorScanBin", () => {
  it("allows manual bin code entry and starts session on success", async () => {
    renderWithProviders(<CollectorScanBin />);

    // Enter BIN-001 and submit
    const input = screen.getByPlaceholderText(/enter bin code/i);
    fireEvent.change(input, { target: { value: "BIN-001" } });
    fireEvent.click(screen.getByRole("button", { name: /search bin/i }));

    // Should show assigned bin confirmation and session active panel
    await screen.findByText(/assigned bin confirmed/i);
    expect(
      await screen.findByText(/collection session active/i)
    ).toBeInTheDocument();

    // The countdown should render in mm:ss format
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();

    // Local storage should have persisted active session
    await waitFor(() => {
      const raw = localStorage.getItem("activeBinSession");
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw);
      expect(parsed.binId).toBeDefined();
      expect(parsed.sessionDurationMinutes).toBeGreaterThan(0);
    });
  });

  it("shows assignment error when scanning a bin not assigned to the collector", async () => {
    renderWithProviders(<CollectorScanBin />);
    const input = screen.getByPlaceholderText(/enter bin code/i);
    fireEvent.change(input, { target: { value: "BIN-999" } });
    fireEvent.click(screen.getByRole("button", { name: /search bin/i }));

    // Expect assignment error UI
    await screen.findByText(/assignment error/i);
    expect(screen.getByText(/not assigned to you/i)).toBeInTheDocument();
    // And helper button to try again
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("validates empty manual input and shows message", async () => {
    renderWithProviders(<CollectorScanBin />);
    // Submit the form without entering a value (button is disabled, so submit the form)
    const form = screen
      .getByText(/or enter manually:/i)
      .closest("div")
      ?.querySelector("form");
    expect(form).toBeTruthy();
    fireEvent.submit(form);
    expect(
      await screen.findByText(/please enter a bin code/i)
    ).toBeInTheDocument();
  });

  it("restores an active session from localStorage on mount", async () => {
    // Seed a stored active session for the assigned bin
    const startedAt = new Date(Date.now() - 60_000).toISOString();
    localStorage.setItem(
      "activeBinSession",
      JSON.stringify({
        binId: "bin-123",
        startedAt,
        sessionDurationMinutes: 15,
      })
    );

    renderWithProviders(<CollectorScanBin />);

    // Assigned bin confirmation and active session should appear without manual input
    await screen.findByText(/assigned bin confirmed/i);
    expect(
      await screen.findByText(/collection session active/i)
    ).toBeInTheDocument();
  });

  it("shows completed state when backend reports session completed", async () => {
    // Override check-session to return completed
    server.use(
      http.get("http://localhost/api/collections/:id/check-session", () =>
        HttpResponse.json({
          sessionStatus: "completed",
          hasActiveSession: false,
          sessionData: {
            startedAt: new Date(Date.now() - 2 * 60_000).toISOString(),
            sessionDurationMinutes: 15,
            initialFillLevel: 50,
            currentFillLevel: 4,
            thresholdMet: true,
          },
          bin: { _id: "bin-123", code: "BIN-001" },
        })
      )
    );

    renderWithProviders(<CollectorScanBin />);
    // Trigger a normal scan flow to start
    const input = screen.getByPlaceholderText(/enter bin code/i);
    fireEvent.change(input, { target: { value: "BIN-001" } });
    fireEvent.click(screen.getByRole("button", { name: /search bin/i }));

    // Completed panel should render
    expect(
      await screen.findByText(/collection completed/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /scan next bin/i })
    ).toBeInTheDocument();
  });

  it("shows expired state when backend reports session expired", async () => {
    // Override check-session to return expired
    server.use(
      http.get("http://localhost/api/collections/:id/check-session", () =>
        HttpResponse.json({
          sessionStatus: "expired",
          hasActiveSession: false,
          sessionData: {
            startedAt: new Date(Date.now() - 16 * 60_000).toISOString(),
            sessionDurationMinutes: 15,
            initialFillLevel: 50,
            currentFillLevel: 50,
            thresholdMet: false,
          },
          bin: { _id: "bin-123", code: "BIN-001" },
        })
      )
    );

    renderWithProviders(<CollectorScanBin />);
    const input = screen.getByPlaceholderText(/enter bin code/i);
    fireEvent.change(input, { target: { value: "BIN-001" } });
    fireEvent.click(screen.getByRole("button", { name: /search bin/i }));

    expect(await screen.findByText(/session expired/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /scan again/i })
    ).toBeInTheDocument();
  });
});
