CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;
--> statement-breakpoint
-- Backfill existing rows with a distinct Iranian mobile (0910… + row number),
-- so the NOT NULL + unique index below cannot fail on pre-existing users.
-- The demo seed then overwrites the demo admin with the canonical
-- 09123456789 on its next run (ON CONFLICT DO UPDATE).
UPDATE "users" SET "phone" = backfill.phone
FROM (
  SELECT
    "id",
    '0910' || lpad((row_number() OVER (ORDER BY "created_at", "id"))::text, 7, '0') AS phone
  FROM "users"
) AS backfill
WHERE "users"."id" = backfill."id" AND "users"."phone" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_unique" ON "password_reset_tokens" USING btree ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_idx" ON "password_reset_tokens" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenant_phone_unique" ON "users" USING btree ("tenant_id","phone");
