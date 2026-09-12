-- Daily step target used as the goal line on the steps chart.
ALTER TABLE "users" ADD COLUMN "stepsGoal" INTEGER NOT NULL DEFAULT 10000;
