-- CreateEnum
CREATE TYPE "EnglishLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ClassroomStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MeetingProvider" AS ENUM ('MANUAL', 'DAILY', 'GOOGLE_MEET', 'ZOOM');

-- CreateTable
CREATE TABLE "classrooms" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" "EnglishLevel" NOT NULL,
    "max_students" INTEGER NOT NULL,
    "current_bookings" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMPTZ(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "meeting_link" TEXT NOT NULL,
    "meeting_provider" "MeetingProvider" NOT NULL DEFAULT 'MANUAL',
    "status" "ClassroomStatus" NOT NULL DEFAULT 'PUBLISHED',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "classrooms_teacher_id_idx" ON "classrooms"("teacher_id");

-- CreateIndex
CREATE INDEX "classrooms_status_scheduled_at_idx" ON "classrooms"("status", "scheduled_at");

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
