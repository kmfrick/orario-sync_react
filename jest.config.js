const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./"
});

const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "pages/**/*.{js,jsx}",
    "!**/*.test.{js,jsx}"
  ]
};

module.exports = createJestConfig(customJestConfig);
