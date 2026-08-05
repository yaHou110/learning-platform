CREATE TABLE IF NOT EXISTS "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiration_date" timestamp with time zone,
	"certificate_hash" text NOT NULL,
	"signed_payload" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "certificates_status_check" CHECK ("certificates"."status" in ('active','revoked'))
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "certificates" ADD CONSTRAINT "certificates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certificates_tenant_user_idx" ON "certificates" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certificates_user_course_idx" ON "certificates" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certificates_hash_idx" ON "certificates" USING btree ("certificate_hash");