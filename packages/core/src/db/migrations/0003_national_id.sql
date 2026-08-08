ALTER TABLE "users" ADD COLUMN "national_id" text;--> statement-breakpoint
-- Backfill existing rows with a distinct 10-digit value (guaranteed unique via
-- row_number, so the NOT NULL + unique index below cannot fail on pre-existing
-- users). The demo seed then overwrites the demo admin with the canonical
-- 1234567891 on its next run (ON CONFLICT DO UPDATE).
UPDATE "users" SET "national_id" = backfill.national_id
FROM (
  SELECT
    "id",
    '10' || lpad((row_number() OVER (ORDER BY "created_at", "id"))::text, 8, '0') AS national_id
  FROM "users"
) AS backfill
WHERE "users"."id" = backfill."id" AND "users"."national_id" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "national_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenant_national_id_unique" ON "users" USING btree ("tenant_id","national_id");
