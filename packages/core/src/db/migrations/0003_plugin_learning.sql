/**
 * Migration: 0003_plugin_learning.sql
 * Added Learning & Progress bounded context (enrollments, lesson_progress)
 */

-- Create enrollments table
CREATE TABLE IF NOT EXISTS "enrollments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  CONSTRAINT "enrollments_status_check" CHECK ("status" IN ('active','completed','dropped'))
);

-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS "lesson_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "enrollment_id" uuid NOT NULL,
  "lesson_id" uuid NOT NULL,
  "status" text NOT NULL DEFAULT 'started',
  "last_position_seconds" integer,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  CONSTRAINT "lesson_progress_status_check" CHECK ("status" IN ('started','completed'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "enrollments_tenant_user_course_idx" ON "enrollments" USING btree ("tenant_id", "user_id", "course_id");
CREATE INDEX IF NOT EXISTS "lesson_progress_enrollment_lesson_idx" ON "lesson_progress" USING btree ("enrollment_id", "lesson_id");

-- Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enable Row-Level Security
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_progress" ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant isolation
DO $$ BEGIN
CREATE POLICY "tenant_isolation_enrollments" ON "enrollments"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "tenant_isolation_lesson_progress" ON "lesson_progress"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
