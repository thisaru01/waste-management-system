import { describe, it, expect, beforeEach } from "vitest";
import { server } from "../../test/testServer.js";
import { http, HttpResponse } from "msw";
import {
  listAssignedBinsForCollector,
  getBinByCode,
  startCollectionSession,
  checkCollectionSession,
  markBinAsCollected,
  updateBinSensor,
  assignBin,
  unassignBin,
} from "../bins.js";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("token", "test-token");
});

describe("bins service", () => {
  it("lists assigned bins when authorized", async () => {
    server.use(
      http.get("http://localhost/api/assignments/my-bins", ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth) {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );
        }
        return HttpResponse.json([{ _id: "b1", code: "BIN-001" }]);
      })
    );
    const bins = await listAssignedBinsForCollector();
    expect(bins).toHaveLength(1);
    expect(bins[0].code).toBe("BIN-001");
  });

  it("updates sensor and returns updated bin", async () => {
    server.use(
      http.patch(
        "http://localhost/api/bins/:id/sensor",
        async ({ params, request }) => {
          const body = await request.json();
          return HttpResponse.json({ _id: params.id, ...body });
        }
      )
    );
    const updated = await updateBinSensor("b1", {
      fillLevelPercent: 30,
      weightKg: 2.4,
    });
    expect(updated._id).toBe("b1");
    expect(updated.fillLevelPercent).toBe(30);
    expect(updated.weightKg).toBe(2.4);
  });

  it("assigns and unassigns a bin", async () => {
    server.use(
      http.patch(
        "http://localhost/api/assignments/bins/:id/assign",
        async ({ params, request }) => {
          const { collectorId } = await request.json();
          return HttpResponse.json({ _id: params.id, assignedTo: collectorId });
        }
      ),
      http.patch(
        "http://localhost/api/assignments/bins/:id/unassign",
        ({ params }) => HttpResponse.json({ _id: params.id, assignedTo: null })
      )
    );

    const a = await assignBin("b2", "collector-9");
    expect(a.assignedTo).toBe("collector-9");
    const u = await unassignBin("b2");
    expect(u.assignedTo).toBeNull();
  });

  it("marks bin as collected", async () => {
    server.use(
      http.patch("http://localhost/api/collections/:id/collect", ({ params }) =>
        HttpResponse.json({
          _id: params.id,
          status: "collected",
          fillLevelPercent: 5,
        })
      )
    );
    const res = await markBinAsCollected("b3");
    expect(res.status).toBe("collected");
    expect(res.fillLevelPercent).toBe(5);
  });

  it("handles getBinByCode 403 and 404 errors", async () => {
    server.use(
      http.get("http://localhost/api/collections/code/:code", ({ params }) => {
        if (params.code === "BIN-403") {
          return HttpResponse.json(
            { message: "Not assigned" },
            { status: 403 }
          );
        }
        if (params.code === "BIN-404") {
          return HttpResponse.json({ message: "Not found" }, { status: 404 });
        }
        return HttpResponse.json({ _id: "x", code: params.code });
      })
    );

    await expect(getBinByCode("BIN-001")).resolves.toEqual({
      _id: "x",
      code: "BIN-001",
    });
    await expect(getBinByCode("BIN-403")).rejects.toHaveProperty(
      "response.status",
      403
    );
    await expect(getBinByCode("BIN-404")).rejects.toHaveProperty(
      "response.status",
      404
    );
  });

  it("starts and checks collection session", async () => {
    server.use(
      http.post(
        "http://localhost/api/collections/:id/start-session",
        ({ params }) =>
          HttpResponse.json({
            sessionStartedAt: new Date().toISOString(),
            sessionDurationMinutes: 15,
            bin: { _id: params.id },
          })
      ),
      http.get("http://localhost/api/collections/:id/check-session", () =>
        HttpResponse.json({
          sessionStatus: "active",
          hasActiveSession: true,
          sessionData: {
            startedAt: new Date().toISOString(),
            sessionDurationMinutes: 15,
          },
        })
      )
    );
    const start = await startCollectionSession("b4");
    expect(start.sessionDurationMinutes).toBe(15);
    const check = await checkCollectionSession("b4");
    expect(check.sessionStatus).toBe("active");
    expect(check.hasActiveSession).toBe(true);
  });
});
