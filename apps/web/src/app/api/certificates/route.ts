import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@learning-platform/core';
import { certificates, enrollments } from '@learning-platform/core/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { createHmac } from 'crypto';

const CERT_SIGNING_SECRET = process.env.CERT_SIGNING_SECRET ?? '';

function signPayload(payload: unknown): string {
  const hmac = createHmac('sha256', CERT_SIGNING_SECRET);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('base64');
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { enrollmentId } = await request.json();
    const db = getDb();
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        eq(enrollments.id, enrollmentId)
      );

    if (!enrollment || enrollment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Enrollment not found or not completed' },
        { status: 404 }
      );
    }

    const certificateId = uuidv4();
    const payloadToSign = {
      certificateId,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      issueDate: new Date().toISOString(),
      enrollmentId: enrollment.id,
    };
    const signature = signPayload(payloadToSign);

    const [newCertificate] = await db
      .insert(certificates)
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
        status: 'active',
      })
      .returning();

    return NextResponse.json(
      { id: newCertificate!.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}