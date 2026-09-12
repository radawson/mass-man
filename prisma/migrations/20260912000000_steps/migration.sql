-- Optional daily step count; weight is no longer required so a steps-only log is valid.
ALTER TABLE "measurements" ALTER COLUMN "weightKg" DROP NOT NULL;
ALTER TABLE "measurements" ADD COLUMN "steps" INTEGER;
