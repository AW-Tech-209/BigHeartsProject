-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "HearingLossLevel" AS ENUM ('NONE', 'MILD', 'MODERATE', 'SEVERE', 'PROFOUND');

-- CreateEnum
CREATE TYPE "CommunicationPreference" AS ENUM ('SIGN_LANGUAGE', 'LIP_READING', 'WRITTEN_TEXT', 'SPOKEN_AUDIO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "communication_preference" "CommunicationPreference",
ADD COLUMN     "hearing_loss_level" "HearingLossLevel",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
