-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferred_instruction_mode" "InstructionMode",
ADD COLUMN     "preferred_supports" "ClassroomSupport"[] NOT NULL DEFAULT ARRAY[]::"ClassroomSupport"[];

-- Traspaso con el mapeo de D44 (`MIGRACION_PREFERENCIA_COMUNICACION`), sin
-- inventar valores: SIGN_LANGUAGE pasa a LSC nativa; lectura labial y texto
-- escrito pasan a apoyo; SPOKEN_AUDIO no tiene destino (D43) y queda sin declarar.
UPDATE "users" SET "preferred_instruction_mode" = 'LSC_NATIVA'
WHERE "communication_preference" = 'SIGN_LANGUAGE';

UPDATE "users" SET "preferred_supports" = ARRAY['LIP_READING']::"ClassroomSupport"[]
WHERE "communication_preference" = 'LIP_READING';

UPDATE "users" SET "preferred_supports" = ARRAY['WRITTEN_TEXT']::"ClassroomSupport"[]
WHERE "communication_preference" = 'WRITTEN_TEXT';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "communication_preference";

-- DropEnum
DROP TYPE "CommunicationPreference";
