import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Simple in-memory state to simulate backend behavior for tests
let assignedBin = {
  _id: "bin-123",
  code: "BIN-001",
  status: "in-collection",
  fillLevelPercent: 50,
  assignedTo: "collector-1",
};

let sessionActive = false;
let sessionData = null; // { startedAt, sessionDurationMinutes, initialFillLevel, currentFillLevel, thresholdMet }

export const handlers = [
  // Root check (optional)
  http.get("http://localhost/", () => HttpResponse.json({ ok: true })),

  // GET /api/collections/code/:code
  http.get("http://localhost/api/collections/code/:code", ({ params }) => {
    const { code } = params;
    if (code === assignedBin.code) {
      return HttpResponse.json(assignedBin);
    }
    // Simulate 403 when code is known but not assigned
    if (code === "BIN-999") {
      return HttpResponse.json(
        { message: "This bin is not assigned to you.", bin: { code } },
        { status: 403 }
      );
    }
    return HttpResponse.json({ message: "Bin not found" }, { status: 404 });
  }),

  // POST /api/collections/:id/start-session
  http.post(
    "http://localhost/api/collections/:id/start-session",
    ({ params }) => {
      const { id } = params;
      if (id !== assignedBin._id) {
        return HttpResponse.json(
          { message: "Bin not assigned to you" },
          { status: 403 }
        );
      }
      const startedAt = new Date().toISOString();
      sessionActive = true;
      sessionData = {
        startedAt,
        sessionDurationMinutes: 15,
        initialFillLevel: assignedBin.fillLevelPercent,
        currentFillLevel: assignedBin.fillLevelPercent,
        thresholdMet: false,
      };
      return HttpResponse.json({
        sessionStartedAt: startedAt,
        sessionDurationMinutes: 15,
        sessionData,
        bin: assignedBin,
      });
    }
  ),

  // GET /api/collections/:id/check-session
  http.get(
    "http://localhost/api/collections/:id/check-session",
    ({ params }) => {
      const { id } = params;
      if (id !== assignedBin._id || !sessionActive || !sessionData) {
        return HttpResponse.json(
          { message: "No active session" },
          { status: 400 }
        );
      }
      // return current sessionData
      return HttpResponse.json({
        sessionStatus: "active",
        sessionData,
        hasActiveSession: true,
        bin: assignedBin,
      });
    }
  ),
];

export const server = setupServer(...handlers);
