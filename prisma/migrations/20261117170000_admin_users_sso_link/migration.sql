-- Keep the local user ID (and all related measurements/goals) when linking SSO.
ALTER TABLE "users" ADD COLUMN "keycloakSubject" TEXT;
CREATE UNIQUE INDEX "users_keycloakSubject_key" ON "users"("keycloakSubject");
-- Prevent case variants from creating separate accounts, including concurrent requests.
-- Existing case-insensitive duplicates must be resolved before applying this migration.
CREATE UNIQUE INDEX "users_email_case_insensitive_key" ON "users"(LOWER("email"));
