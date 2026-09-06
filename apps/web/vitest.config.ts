import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    maxWorkers: 1,
    setupFiles: ["./vitest.setup.ts"],
  },
});
