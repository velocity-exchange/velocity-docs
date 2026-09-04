import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["components/**/*.test.ts", "app/**/*.test.ts"],
    environment: "node",
  },
});
