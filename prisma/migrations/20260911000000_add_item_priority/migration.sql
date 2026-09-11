CREATE TYPE "ItemPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');
ALTER TABLE "items" ADD COLUMN "priority" "ItemPriority" NOT NULL DEFAULT 'NORMAL';
