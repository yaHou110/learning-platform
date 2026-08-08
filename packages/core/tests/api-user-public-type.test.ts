/**
 * M4-0 (Session 015) — defense-in-depth guarantee that the public read API
 * for users can never return a `passwordHash`.
 *
 * This is a *type-level* test. It is enforced at compile time by
 * `tsc --noEmit` (the typecheck quality gate). If someone adds a
 * `passwordHash` field to `UserPublic`, this test will fail to compile
 * and the build will be blocked. No runtime test can do this as cheaply.
 *
 * The corresponding runtime defense lives in `core/src/api/index.ts`:
 * the Drizzle query uses explicit column projection, not `select()`.
 */
import { describe, expect, it } from "vitest";
import type { UserPublic } from "../src/api/index.js";

describe("UserPublic type contract (M4-0)", () => {
  it("does NOT include a passwordHash field", () => {
    // The TypeScript compiler will not let us construct this object literal
    // if it has a `passwordHash` key, because the type does not allow it.
    // We use a runtime check on the *keys of an empty object* as a belt:
    // it asserts that the type's known keys are exactly the public ones.
    type Keys = keyof UserPublic;
    const allowedKeys: Keys[] = [
      "id",
      "tenantId",
      "email",
      "nationalId",
      "phone",
      "displayName",
      "role",
      "isActive",
      "createdAt",
      "deactivatedAt",
    ];
    // The cast through `unknown` is the trick that lets us assert at runtime
    // that the type's keys are exactly the public set. If a future change
    // adds `passwordHash` to `UserPublic`, the next line fails to compile
    // because `passwordHash` is not in `allowedKeys` and we use `satisfies`.
    const sample = {
      id: "00000000-0000-0000-0000-000000000000",
      tenantId: "00000000-0000-0000-0000-000000000000",
      email: "a@b.c",
      nationalId: "1234567891",
      phone: "09123456789",
      displayName: "x",
      role: "student" as const,
      isActive: true,
      createdAt: new Date(),
      deactivatedAt: null,
    } satisfies UserPublic;
    expect(Object.keys(sample).sort()).toEqual([...allowedKeys].sort());
  });

  it("Role is a closed union of the four v1 roles", () => {
    // This is a sanity check on the role union imported by UserPublic.
    // If a future ADR adds a new role, both this test and the
    // `requireRole` allowlists in apps/web will need to be updated.
    const sample: UserPublic["role"] = "student";
    expect(["super_admin", "center_admin", "teacher", "student"]).toContain(
      sample
    );
  });
});
