-- AlterTable
ALTER TABLE "classrooms" ADD COLUMN     "communication_modes" "CommunicationPreference"[],
ADD COLUMN     "has_interpreter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_live_captions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_visual_materials" BOOLEAN NOT NULL DEFAULT false;
