import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@hawza/core": path.resolve(__dirname, "../../core/src"),
      "@hawza/contracts": path.resolve(__dirname, "../../contracts/src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
