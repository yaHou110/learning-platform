-- Enable citext extension for case-insensitive email (must be before citext column references)
CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" citext NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	CONSTRAINT "users_role_check" CHECK ("users"."role" in ('super_admin','center_admin','teacher','student'))
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_unique" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenant_email_unique" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_tenant_idx" ON "users" USING btree ("tenant_id");
-- Enable Row-Level Security
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- RLS policy: non-super_admin users can only see their own tenant's data
-- NOTE (2026-07-22): switched from "TO authenticated" (Supabase pseudo-role) to "TO PUBLIC"
-- because the local/VPS PostgreSQL does NOT have an "authenticated" role — the RLS migration
-- would fail with "role 'authenticated' does not exist" and crash the app. PUBLIC is the
-- standard PG catch-all. v1 enforces tenant isolation at the application layer via WHERE
-- clauses anyway; these policies are defense-in-depth for future use.
CREATE POLICY "tenant_isolation_users" ON "users"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING ("tenant_id" = current_setting('app.tenant_id')::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation_tenants" ON "tenants"
  AS PERMISSIVE FOR SELECT
  TO PUBLIC
  USING ("id" = current_setting('app.tenant_id')::uuid);