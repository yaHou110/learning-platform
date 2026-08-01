// apps/web/src/app/courses/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { catalog } from '@learning-platform/core/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/courses - List courses for current tenant (published only)
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
  }

  try {
    const courses = await catalog.listCourses(tenantId, {});
    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

/**
 * POST /api/courses - Create a new course
 */
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, description, createdBy } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const course = await catalog.createCourse(tenantId, createdBy, {
      title,
      description,
    });

    return NextResponse.json({ course: course }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}