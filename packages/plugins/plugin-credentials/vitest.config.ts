import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@learning-platform/core": path.resolve(__dirname, "../../core/src"),
      "@learning-platform/contracts": path.resolve(__dirname, "../../contracts/src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
