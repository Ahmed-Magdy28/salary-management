module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test/e2e"],
  testRegex: ".*\\.e2e-spec\\.ts$",
  globalSetup: "<rootDir>/test/e2e/global-setup.ts",
  setupFiles: ["<rootDir>/test/e2e/setup-env.ts"],
  testTimeout: 20000,
};
