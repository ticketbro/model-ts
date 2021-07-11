module.exports = {
  preset: "ts-jest",
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  setupFilesAfterEnv: ["./src/test-utils/setup.ts"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
}
