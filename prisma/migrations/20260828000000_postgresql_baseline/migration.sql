-- PostgreSQL baseline for fresh Habit Runner installations.
CREATE TYPE "ItemType" AS ENUM ('HABIT', 'QUIT_HABIT', 'TODO');
CREATE TYPE "Layer" AS ENUM ('BODY', 'CRAFT', 'SIGNAL', 'MEMORY', 'JUDGMENT', 'CONTEMPLATION', 'LIFE');
CREATE TYPE "EnergyLevel" AS ENUM ('HIGH', 'NORMAL', 'LOW', 'REST');
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "CheckInStatus" AS ENUM ('COMPLETED', 'KEPT', 'LAPSED', 'REST', 'SKIPPED');

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color_code" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "why_prompt" TEXT,
    "type" "ItemType" NOT NULL,
    "layer" "Layer" NOT NULL DEFAULT 'LIFE',
    "custom_category" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "unit_type" TEXT,
    "target_amount" DOUBLE PRECISION,
    "unit_label" TEXT,
    "frequency_days" TEXT,
    "target_per_week" INTEGER,
    "due_date" TEXT,
    "trigger_cue" TEXT,
    "quit_context" TEXT,
    "high_risk_window" TEXT,
    "todo_recurrence" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "color_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),
    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "energy_action_presets" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "energy_level" "EnergyLevel" NOT NULL,
    "action_text" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "energy_action_presets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tool_links" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "energy_level" "EnergyLevel",
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tool_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_energy_states" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "energy_level" "EnergyLevel" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "daily_energy_states_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" "CheckInStatus" NOT NULL,
    "planned_energy" "EnergyLevel",
    "actual_energy" "EnergyLevel",
    "action_text" TEXT,
    "actual_amount" DOUBLE PRECISION,
    "completion_rate" INTEGER,
    "rest_reason_tag" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
CREATE UNIQUE INDEX "categories_user_id_name_key" ON "categories"("user_id", "name");
CREATE INDEX "items_user_id_status_idx" ON "items"("user_id", "status");
CREATE INDEX "items_user_id_type_idx" ON "items"("user_id", "type");
CREATE UNIQUE INDEX "energy_action_presets_item_id_energy_level_key" ON "energy_action_presets"("item_id", "energy_level");
CREATE INDEX "daily_energy_states_user_id_date_idx" ON "daily_energy_states"("user_id", "date");
CREATE UNIQUE INDEX "daily_energy_states_user_id_date_key" ON "daily_energy_states"("user_id", "date");
CREATE INDEX "check_ins_user_id_date_idx" ON "check_ins"("user_id", "date");
CREATE INDEX "check_ins_item_id_date_idx" ON "check_ins"("item_id", "date");
CREATE UNIQUE INDEX "check_ins_item_id_date_key" ON "check_ins"("item_id", "date");

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "energy_action_presets" ADD CONSTRAINT "energy_action_presets_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tool_links" ADD CONSTRAINT "tool_links_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_energy_states" ADD CONSTRAINT "daily_energy_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
