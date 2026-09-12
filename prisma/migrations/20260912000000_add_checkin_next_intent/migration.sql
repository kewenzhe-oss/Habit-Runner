-- Add next_intent column to check_ins table for "Next Action Seed" feature
ALTER TABLE "check_ins" ADD COLUMN "next_intent" TEXT;
