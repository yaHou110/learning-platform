/**
 * Credentials Plugin — public API surface for certificate issuance & verification.
 *
 * All database access goes through `@learning-platform/core/db/client`.
 * The `apps/web` layer must NOT import `drizzle-orm` directly (ADR-0006).
 */
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { createHmac } from "node:crypto";
import { randomUUID } from "node:crypto";

export type Certificate = typeof schema.certificates.$inferSelect;

const CERT_SIGNING_SECRET = process.env.CERT_SIGNING_SECRET ?? "";

function signPayload(payload: unknown): string {
  const hmac = createHmac("sha256", CERT_SIGNING_SECRET);
  hmac.update(JSON.stringify(payload));
  return hmac.digest("base64");
}

export const credentials = {
  /**
   * Issue a certificate for a completed enrollment.
   * Returns `{ id, hash }` or throws if the enrollment is not found / not completed.
   */
  async issueCertificate(enrollmentId: string): Promise<{ id: string; hash: string }> {
    const db = getDb();

    // Verify enrollment exists and is completed
    const [enrollment] = await db
      .select()
      .from(schema.enrollments)
      .where(eq(schema.enrollments.id, enrollmentId))
      .limit(1);

    if (!enrollment || enrollment.status !== "completed") {
      throw new Error("ENROLLMENT_NOT_FOUND_OR_NOT_COMPLETED");
    }

    // Check if certificate already issued (idempotent)
    const existing = await db
      .select({ id: schema.certificates.id, certificateHash: schema.certificates.certificateHash })
      .from(schema.certificates)
      .where(eq(schema.certificates.enrollmentId, enrollmentId))
      .limit(1);

    const [certificate] = existing;
    if (certificate) {
      return { id: certificate.id, hash: certificate.certificateHash };
    }

    // Issue new certificate
    const certificateId = randomUUID();
    const payloadToSign = {
      certificateId,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      issueDate: new Date().toISOString(),
      enrollmentId: enrollment.id,
    };
    const signature = signPayload(payloadToSign);

    await db
      .insert(schema.certificates)
      .values({
        id: certificateId,
        tenantId: enrollment.tenantId,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        enrollmentId: enrollment.id,
        issueDate: new Date(),
        expirationDate: null,
        certificateHash: signature,
        signedPayload: payloadToSign,
        status: "active",
      });

    return { id: certificateId, hash: signature };
  },

  /**
   * Verify a certificate by its hash (HMAC signature).
   * Returns the certificate public data or throws if not found / invalid.
   */
  async verifyCertificate(hash: string): Promise<Certificate> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.certificates)
      .where(eq(schema.certificates.certificateHash, hash))
      .limit(1);

    if (!row) {
      throw new Error("CERTIFICATE_NOT_FOUND");
    }

    return row;
  },
};

