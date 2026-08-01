import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@learning-platform/core';
import { certificates } from '@learning-platform/core/db/schema';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');

    if (!hash) {
      return NextResponse.json(
        { error: 'Missing hash parameter' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [cert] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.certificateHash, hash));

    if (!cert) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    if (cert.status !== 'active') {
      return NextResponse.json(
        { error: 'Certificate is not active' },
        { status: 410 }
      );
    }

    if (cert.expirationDate && new Date(cert.expirationDate) < now) {
      return NextResponse.json(
        { error: 'Certificate has expired' },
        { status: 410 }
      );
    }

    const {
      id,
      tenantId,
      userId,
      courseId,
      enrollmentId,
      issueDate,
      expirationDate,
      status,
    } = cert;

    return NextResponse.json({
      id,
      tenantId,
      userId,
      courseId,
      enrollmentId,
      issueDate,
      expirationDate,
      status,
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}