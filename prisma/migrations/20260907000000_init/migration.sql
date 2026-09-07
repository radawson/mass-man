-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'GUEST');

-- CreateEnum
CREATE TYPE "UnitSystem" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "BodyFatSource" AS ENUM ('DEVICE', 'ESTIMATED', 'AUTO');

-- CreateEnum
CREATE TYPE "GoalMetric" AS ENUM ('WEIGHT', 'BODY_FAT', 'WAIST', 'CHEST', 'HIPS', 'UPPER_ARM', 'THIGH');

-- CreateEnum
CREATE TYPE "GoalDirection" AS ENUM ('DECREASE', 'INCREASE', 'MAINTAIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isKeycloakUser" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayUnit" "UnitSystem" NOT NULL DEFAULT 'IMPERIAL',
    "theme" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "timeZone" TEXT NOT NULL DEFAULT 'America/New_York',
    "heightCm" DECIMAL(6,2),
    "sex" "Sex",
    "bodyFatSource" "BodyFatSource" NOT NULL DEFAULT 'AUTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "weightKg" DECIMAL(8,4) NOT NULL,
    "bodyFatPercentDevice" DECIMAL(5,2),
    "neckCm" DECIMAL(6,2),
    "shouldersCm" DECIMAL(6,2),
    "chestCm" DECIMAL(6,2),
    "waistCm" DECIMAL(6,2),
    "hipsCm" DECIMAL(6,2),
    "leftUpperArmCm" DECIMAL(6,2),
    "rightUpperArmCm" DECIMAL(6,2),
    "leftThighCm" DECIMAL(6,2),
    "rightThighCm" DECIMAL(6,2),
    "leftCalfCm" DECIMAL(6,2),
    "rightCalfCm" DECIMAL(6,2),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metric" "GoalMetric" NOT NULL,
    "direction" "GoalDirection" NOT NULL,
    "startValue" DECIMAL(10,4) NOT NULL,
    "targetValue" DECIMAL(10,4) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "milestoneNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "measurements_userId_recordedAt_idx" ON "measurements"("userId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "goals_userId_metric_key" ON "goals"("userId", "metric");

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
