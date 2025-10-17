import request from "supertest";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import binRepo from "../src/repositories/bin.repository.js";
import historyRepo from "../src/repositories/collectionHistory.repository.js";

// In-memory store to avoid MongoDB
const mem = {
  bins: new Map(),
  histories: [],
};

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function makeDoc(data) {
  const base = clone(data);
  return {
    ...base,
    async populate(field) {
      if (
        field === "assignedCollector" &&
        typeof this.assignedCollector === "string"
      ) {
        this.assignedCollector = {
          _id: base.assignedCollector,
          firstName: "Test",
          lastName: "Collector",
          email: "collector@example.com",
          roles: [{ name: "collector", displayName: "Collector" }],
        };
      }
      if (field === "owner" && typeof this.owner === "string") {
        this.owner = {
          _id: base.owner,
          firstName: "Owner",
          lastName: "User",
          email: "owner@example.com",
          roles: [{ name: "bin-owner", displayName: "Bin Owner" }],
        };
      }
      return this;
    },
    toObject() {
      return { ...this };
    },
  };
}

// Override repository methods to work in-memory
beforeAll(() => {
  binRepo.list = async (filter = {}) => {
    const arr = Array.from(mem.bins.values());
    return clone(
      arr.filter((b) => Object.entries(filter).every(([k, v]) => b[k] === v))
    );
  };
  binRepo.findById = async (id) => {
    const b = mem.bins.get(id);
    return b ? makeDoc(b) : null;
  };
  binRepo.findByCode = async (code) => {
    const b = Array.from(mem.bins.values()).find((x) => x.code === code.trim());
    return b ? makeDoc(b) : null;
  };
  binRepo.create = async (data) => {
    const id = data._id || `bin_${mem.bins.size + 1}`;
    const now = new Date().toISOString();
    const doc = {
      _id: id,
      code: data.code,
      type: data.type || "public",
      capacityLiters: data.capacityLiters ?? 120,
      location: data.location || { description: "" },
      owner: data.owner || null,
      assignedCollector: data.assignedCollector || null,
      assignedAt: data.assignedAt || null,
      fillLevelPercent: data.fillLevelPercent ?? 0,
      weightKg: data.weightKg ?? 0,
      status: data.status || "normal",
      sessionStartedAt: data.sessionStartedAt ?? null,
      sessionInitialFillLevel: data.sessionInitialFillLevel ?? null,
      createdAt: now,
      updatedAt: now,
    };
    mem.bins.set(id, doc);
    return makeDoc(doc);
  };
  binRepo.updateSensor = async (id, { fillLevelPercent, weightKg, status }) => {
    const b = mem.bins.get(id);
    if (!b) return null;
    if (typeof fillLevelPercent === "number") {
      b.fillLevelPercent = Math.max(0, Math.min(100, fillLevelPercent));
    }
    if (typeof weightKg === "number") b.weightKg = Math.max(0, weightKg);
    if (typeof status === "string") b.status = status;
    b.lastReadingAt = new Date().toISOString();
    b.updatedAt = new Date().toISOString();
    mem.bins.set(id, b);
    return makeDoc(b);
  };
  binRepo.startSession = async (id, sessionData) => {
    const b = mem.bins.get(id);
    if (!b) return null;
    Object.assign(b, sessionData);
    b.updatedAt = new Date().toISOString();
    mem.bins.set(id, b);
    return makeDoc(b);
  };
  binRepo.endSession = async (id) => {
    const b = mem.bins.get(id);
    if (!b) return null;
    b.sessionStartedAt = null;
    b.sessionInitialFillLevel = null;
    b.updatedAt = new Date().toISOString();
    mem.bins.set(id, b);
    return makeDoc(b);
  };
  binRepo.assignCollector = async (id, collectorId) => {
    const b = mem.bins.get(id);
    if (!b) return null;
    b.assignedCollector = collectorId;
    b.assignedAt = new Date().toISOString();
    if (b.status === "needs-collection" || b.status === "overflow")
      b.status = "assigned";
    mem.bins.set(id, b);
    return makeDoc(b);
  };
  binRepo.clearAssignment = async (id) => {
    const b = mem.bins.get(id);
    if (!b) return null;
    b.assignedCollector = null;
    b.assignedAt = null;
    mem.bins.set(id, b);
    return makeDoc(b);
  };

  historyRepo.create = async (payload) => {
    const doc = { _id: `hist_${mem.histories.length + 1}`, ...clone(payload) };
    mem.histories.push(doc);
    return doc;
  };
  historyRepo.listByCollector = async (collectorId) =>
    mem.histories.filter((h) => h.collector === collectorId);
  historyRepo.listAll = async () => clone(mem.histories);
});

function makeToken({ sub, roles, email = "u@example.com" }) {
  return jwt.sign({ sub, roles, email }, process.env.JWT_SECRET);
}

function auth(t) {
  return { Authorization: `Bearer ${t}` };
}

describe("Collector end-to-end flow (no DB)", () => {
  const collectorId = "collector_1";
  const otherCollectorId = "collector_2";
  const adminToken = makeToken({
    sub: "admin_1",
    roles: ["admin"],
    email: "admin@example.com",
  });
  const collectorToken = makeToken({
    sub: collectorId,
    roles: ["collector"],
    email: "collector@example.com",
  });

  let b1;
  let b2;
  let b3; // bins assigned to collector

  beforeEach(async () => {
    mem.bins.clear();
    mem.histories.length = 0;
    b1 = (
      await binRepo.create({
        _id: "b1",
        code: "PUB-100",
        fillLevelPercent: 90,
        status: "needs-collection",
        assignedCollector: collectorId,
      })
    ).toObject();
    b2 = (
      await binRepo.create({
        _id: "b2",
        code: "PUB-101",
        fillLevelPercent: 40,
        status: "normal",
        assignedCollector: collectorId,
      })
    ).toObject();
    b3 = (
      await binRepo.create({
        _id: "b3",
        code: "PUB-102",
        fillLevelPercent: 88,
        status: "needs-collection",
        assignedCollector: collectorId,
      })
    ).toObject();
    // Another collector bin
    await binRepo.create({
      _id: "b4",
      code: "PUB-999",
      fillLevelPercent: 80,
      status: "needs-collection",
      assignedCollector: otherCollectorId,
    });
  });

  it("lists my assigned bins", async () => {
    const res = await request(app)
      .get("/api/assignments/my-bins")
      .set(auth(collectorToken))
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.map((x) => x._id)).toEqual(
      expect.arrayContaining(["b1", "b2", "b3"])
    );
  });

  it("scan by code enforces assignment", async () => {
    // Wrong bin -> 403
    let res = await request(app)
      .get("/api/collections/code/PUB-999")
      .set(auth(collectorToken))
      .expect(403);
    expect(res.body.message).toMatch(/not assigned/i);
    // Correct bin -> 200
    res = await request(app)
      .get("/api/collections/code/PUB-100")
      .set(auth(collectorToken))
      .expect(200);
    expect(res.body.code).toBe("PUB-100");
  });

  it("start session, early collect fails, sensor <=5 completes via check-session", async () => {
    // start
    let r = await request(app)
      .post(`/api/collections/${b1._id}/start-session`)
      .set(auth(collectorToken))
      .expect(200);
    expect(r.body.message).toMatch(/session started/i);

    // early collect -> 400
    r = await request(app)
      .patch(`/api/collections/${b1._id}/collect`)
      .set(auth(collectorToken))
      .expect(400);
    expect(r.body.message).toMatch(/5% or below/i);

    // reduce to 3% via admin endpoint
    r = await request(app)
      .patch(`/api/bins/${b1._id}/sensor`)
      .set(auth(adminToken))
      .send({ fillLevelPercent: 3 })
      .expect(200);
    expect(r.body.fillLevelPercent).toBe(3);

    // check session -> completed
    r = await request(app)
      .get(`/api/collections/${b1._id}/check-session`)
      .set(auth(collectorToken))
      .expect(200);
    expect(r.body.sessionStatus).toBe("completed");
    expect(r.body.hasActiveSession).toBe(false);
    expect(r.body.bin.status).toBe("collected");
  });

  it("finish schedule fails until all collected, then creates history", async () => {
    // collect b1 only
    await request(app)
      .post(`/api/collections/${b1._id}/start-session`)
      .set(auth(collectorToken));
    await request(app)
      .patch(`/api/bins/${b1._id}/sensor`)
      .set(auth(adminToken))
      .send({ fillLevelPercent: 4 });
    await request(app)
      .get(`/api/collections/${b1._id}/check-session`)
      .set(auth(collectorToken));

    let res = await request(app)
      .post("/api/history/finish-today")
      .set(auth(collectorToken))
      .expect(400);
    expect(res.body.message).toMatch(/All bins must be collected/i);

    // collect remaining
    for (const b of [b2, b3]) {
      await request(app)
        .post(`/api/collections/${b._id}/start-session`)
        .set(auth(collectorToken));
      await request(app)
        .patch(`/api/bins/${b._id}/sensor`)
        .set(auth(adminToken))
        .send({ fillLevelPercent: 1 });
      await request(app)
        .get(`/api/collections/${b._id}/check-session`)
        .set(auth(collectorToken));
    }

    res = await request(app)
      .post("/api/history/finish-today")
      .set(auth(collectorToken))
      .expect(201);
    expect(res.body.summary.totalBins).toBe(3);
    expect(res.body.summary.collectedBins).toBe(3);

    // list my history
    const hist = await request(app)
      .get("/api/history/my")
      .set(auth(collectorToken))
      .expect(200);
    expect(Array.isArray(hist.body)).toBe(true);
    expect(hist.body[0].summary.totalBins).toBe(3);
  });

  it("edge: session expiry resets to assigned", async () => {
    await request(app)
      .post(`/api/collections/${b3._id}/start-session`)
      .set(auth(collectorToken))
      .expect(200);
    // backdate session start > 1 minute
    const rec = mem.bins.get(b3._id);
    rec.sessionStartedAt = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    mem.bins.set(b3._id, rec);
    const res = await request(app)
      .get(`/api/collections/${b3._id}/check-session`)
      .set(auth(collectorToken))
      .expect(200);
    expect(res.body.sessionStatus).toBe("expired");
    expect(res.body.bin.status).toBe("assigned");
  });

  it("negative: check-session without active session -> 400; markAsCollected without session -> 400", async () => {
    const res1 = await request(app)
      .get(`/api/collections/${b2._id}/check-session`)
      .set(auth(collectorToken))
      .expect(400);
    expect(res1.body.hasActiveSession).toBe(false);

    const res2 = await request(app)
      .patch(`/api/collections/${b2._id}/collect`)
      .set(auth(collectorToken))
      .expect(400);
    expect(res2.body.message).toMatch(/active collection session/i);
  });
});

// Additional coverage to exercise uncovered branches
describe("Collector flow - additional branches", () => {
  const collectorId = "collector_X";
  const otherCollectorId = "collector_Y";
  const adminToken = makeToken({
    sub: "admin_X",
    roles: ["admin"],
    email: "admin@example.com",
  });
  const collectorToken = makeToken({
    sub: collectorId,
    roles: ["collector"],
    email: "collector@example.com",
  });
  const otherCollectorToken = makeToken({
    sub: otherCollectorId,
    roles: ["collector"],
    email: "other@example.com",
  });

  let b1;

  beforeEach(async () => {
    mem.bins.clear();
    mem.histories.length = 0;
    b1 = (
      await binRepo.create({
        _id: "bx1",
        code: "PUB-X1",
        fillLevelPercent: 87,
        status: "needs-collection",
        assignedCollector: collectorId,
      })
    ).toObject();
  });

  it("getBinByCode: unknown code -> 404", async () => {
    const res = await request(app)
      .get("/api/collections/code/NO-SUCH")
      .set(auth(collectorToken))
      .expect(404);
    expect((res.body.message || "").toLowerCase()).toMatch(/not found/);
  });

  it("finish-today with no assigned bins -> 400", async () => {
    // Clear assignment for all bins
    for (const id of Array.from(mem.bins.keys())) {
      const rec = mem.bins.get(id);
      rec.assignedCollector = null;
      mem.bins.set(id, rec);
    }
    const res = await request(app)
      .post("/api/history/finish-today")
      .set(auth(collectorToken))
      .expect(400);
    expect((res.body.message || "").toLowerCase()).toMatch(/no bins assigned/);
  });

  it("start-session: repo fails to start -> 404 'Failed to start session'", async () => {
    const spy = jest.spyOn(binRepo, "startSession").mockResolvedValueOnce(null);
    const res = await request(app)
      .post(`/api/collections/${b1._id}/start-session`)
      .set(auth(collectorToken))
      .expect(404);
    expect((res.body.message || "").toLowerCase()).toMatch(
      /failed to start session/
    );
    spy.mockRestore();
  });

  it("check-session: 403 when bin assigned to another collector", async () => {
    // Reassign to other collector
    const rec = mem.bins.get(b1._id);
    rec.assignedCollector = otherCollectorId;
    mem.bins.set(b1._id, rec);

    const res = await request(app)
      .get(`/api/collections/${b1._id}/check-session`)
      .set(auth(collectorToken))
      .expect(403);
    expect((res.body.message || "").toLowerCase()).toMatch(/not assigned/);
  });

  it("manual collect succeeds at boundary 5% when in session", async () => {
    // Start session
    await request(app)
      .post(`/api/collections/${b1._id}/start-session`)
      .set(auth(collectorToken))
      .expect(200);
    // Set to exactly 5% without auto-marking collected (avoid sensor route that auto-collects)
    const rec = mem.bins.get(b1._id);
    rec.fillLevelPercent = 5;
    // keep status as in-collection
    rec.status = "in-collection";
    mem.bins.set(b1._id, rec);
    // Manual collect path
    const res = await request(app)
      .patch(`/api/collections/${b1._id}/collect`)
      .set(auth(collectorToken))
      .expect(200);
    // Some controllers return updated bin directly; ensure status reflects collected
    const status = res.body.status || res.body?.bin?.status;
    expect(status).toBe("collected");
  });
});
