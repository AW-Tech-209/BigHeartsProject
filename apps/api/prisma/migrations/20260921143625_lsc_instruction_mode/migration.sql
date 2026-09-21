-- AlterEnum
ALTER TYPE "MeetingProvider" ADD VALUE 'MICROSOFT_TEAMS';

-- CreateEnum
CREATE TYPE "InstructionMode" AS ENUM ('LSC_NATIVA', 'INTERPRETE_LSC');

-- CreateEnum
CREATE TYPE "ClassroomSupport" AS ENUM ('LIP_READING', 'WRITTEN_TEXT', 'LIVE_CAPTIONS', 'VISUAL_MATERIALS');

-- AlterTable
-- Ninguna fila recibe un modo inventado (HU-506, T1): `instruction_mode` nace
-- NULL para toda aula existente, y así se queda hasta que su profesor lo
-- declare.
ALTER TABLE "classrooms" DROP COLUMN "communication_modes",
DROP COLUMN "has_interpreter",
DROP COLUMN "has_live_captions",
DROP COLUMN "has_visual_materials",
ADD COLUMN "instruction_mode" "InstructionMode",
ADD COLUMN "supports" "ClassroomSupport"[] NOT NULL DEFAULT ARRAY[]::"ClassroomSupport"[];
