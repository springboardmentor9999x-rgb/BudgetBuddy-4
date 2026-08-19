module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/test/setup.cjs"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  moduleNameMapper: { "\\.(css)$": "<rootDir>/test/styleMock.cjs" },
  globals: { __VITE_API_URL__: "" },
};
