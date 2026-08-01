-- Migration: 0002_plugin_catalog.sql
-- Added Catalog & Content bounded context (courses, lessons, media_assets)

-- Create courses table
CREATE TABLE IF NOT EXISTS "courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "status" text NOT NULL DEFAULT 'draft',
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "courses_status_check" CHECK ("status" IN ('draft','published','archived'))
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS "lessons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "title" text NOT NULL,
  "content_type" text NOT NULL DEFAULT 'text',
  "content_ref" text,
  "order_index" integer NOT NULL DEFAULT 0,
  "duration_seconds" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "lessons_content_type_check" CHECK ("content_type" IN ('video','audio','pdf','text'))
);

-- Create media_assets table
CREATE TABLE IF NOT EXISTS "media_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "storage_key" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" bigint NOT NULL,
  "checksum" text,
  "uploaded_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "courses_tenant_idx" ON "courses" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "courses_tenant_status_idx" ON "courses" USING btree ("tenant_id", "status") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "lessons_tenant_course_idx" ON "lessons" USING btree ("tenant_id", "course_id");
CREATE INDEX IF NOT EXISTS "lessons_course_order_idx" ON "lessons" USING btree ("course_id", "order_index") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "media_assets_tenant_idx" ON "media_assets" USING btree ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "media_assets_storage_key_unique" ON "media_assets" USING btree ("storage_key");

-- Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enable Row-Level Security
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant isolation
DO $$ BEGIN
CREATE POLICY "tenant_isolation_courses" ON "courses"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "tenant_isolation_lessons" ON "lessons"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "tenant_isolation_media_assets" ON "media_assets"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
