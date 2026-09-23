-- Profile age for training heart-rate zones, and optional vitals on each log.
ALTER TABLE "users" ADD COLUMN "dateOfBirth" DATE;

ALTER TABLE "measurements" ADD COLUMN "heartRateBpm" INTEGER;
ALTER TABLE "measurements" ADD COLUMN "systolic" INTEGER;
ALTER TABLE "measurements" ADD COLUMN "diastolic" INTEGER;
ALTER TABLE "measurements" ADD COLUMN "temperatureC" DECIMAL(4,2);
ALTER TABLE "measurements" ADD COLUMN "oxygenSaturation" DECIMAL(4,1);
