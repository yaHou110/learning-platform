/**
 * ESLint config for plugins.
 *
 * The KEY rule here is `no-restricted-imports`: plugins may not import
 * `drizzle-orm` or `pg` directly. This is the enforcement layer for ADR-0006.
 *
 * If a plugin ever needs DB access, it must go through `@learning-platform/core/api`.
 */
module.exports = {
  root: false,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: { node: true, es2022: true },
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "drizzle-orm",
            message: "Plugins may not import drizzle-orm directly. Use @learning-platform/core/api.",
          },
          {
            name: "drizzle-orm/node-postgres",
            message: "Plugins may not import drizzle-orm/node-postgres. Use @learning-platform/core/api.",
          },
          {
            name: "pg",
            message: "Plugins may not import pg directly. Use @learning-platform/core/api.",
          },
        ],
        patterns: ["drizzle-orm/*", "pg/*"],
      },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
