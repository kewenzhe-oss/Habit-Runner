-- Idempotent adoption layer for databases that predate Prisma migration history.
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "trigger_cue" TEXT;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "quit_context" TEXT;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "high_risk_window" TEXT;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "todo_recurrence" TEXT;

UPDATE "items"
SET "high_risk_window" = "frequency_days"
WHERE "type" = 'QUIT_HABIT'
  AND "high_risk_window" IS NULL
  AND "frequency_days" IS NOT NULL;

UPDATE "items"
SET "todo_recurrence" = "frequency_days"
WHERE "type" = 'TODO'
  AND "todo_recurrence" IS NULL
  AND "frequency_days" IN ('ONCE', 'WEEKLY', 'MONTHLY');

UPDATE "items" AS item
SET "category_id" = category."id"
FROM "categories" AS category
WHERE item."category_id" IS NULL
  AND item."custom_category" = category."name"
  AND item."user_id" = category."user_id";
