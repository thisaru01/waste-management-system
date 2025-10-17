export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/controllers/collection/**/*.js",
    "src/controllers/session/**/*.js",
    "src/controllers/history/**/*.js",
    "src/routes/collection/**/*.js",
    "src/routes/history/**/*.js",
    "src/routes/assignment/**/*.js",
  ],
  coverageDirectory: "coverage",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
