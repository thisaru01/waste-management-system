import { jest } from "@jest/globals";
// Provide required env defaults for tests and increase default timeout
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
process.env.COLLECTION_SESSION_MINUTES =
  process.env.COLLECTION_SESSION_MINUTES || "1";

jest.setTimeout(30000);

afterEach(() => {
  jest.restoreAllMocks();
});
