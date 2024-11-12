module.exports = {
  preset: "ts-jest",
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      isolatedModules: true,
    }],
  },
  setupFilesAfterEnv: ["./src/test-utils/setup.ts"]
}
