/**
 * Domain events — names and payload shapes.
 *
 * Names must match the event map in `docs/02-architecture/BOUNDED_CONTEXTS.md`.
 * Payloads are minimal; richer payload types live next to the emitter.
 */
import { z } from "zod";

export const EventNames = [
  "tenant.created",
  "tenant.provisioned",
  "user.invited",
  "user.role_changed",
  "user.deactivated",
  "auth.login",
  "auth.login_failed",
  "course.published",
  "course.archived",
  "lesson.created",
  "lesson.updated",
  "media.uploaded",
  "enrollment.created",
  "enrollment.completed",
  "lesson.progress.updated",
  "course.completed",
  "path.updated",
  "certificate.issued",
  "certificate.verified",
  "plugin.enabled",
  "plugin.disabled",
  "audit.recorded",
] as const;

export type EventName = (typeof EventNames)[number];

export const AuthLoginPayload = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  at: z.string().datetime(),
});
export type AuthLoginPayload = z.infer<typeof AuthLoginPayload>;

export const AuthLoginFailedPayload = z.object({
  tenantSlug: z.string(),
  email: z.string(),
  reason: z.enum(["unknown_tenant", "unknown_user", "bad_password", "inactive"]),
  at: z.string().datetime(),
});
export type AuthLoginFailedPayload = z.infer<typeof AuthLoginFailedPayload>;
