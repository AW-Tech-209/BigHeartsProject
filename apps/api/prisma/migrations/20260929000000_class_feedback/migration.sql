-- CreateEnum
CREATE TYPE "SeguimientoClase" AS ENUM ('SI', 'A_MEDIAS', 'NO');

-- CreateEnum
CREATE TYPE "ProblemaClase" AS ENUM ('INTERPRETE', 'SUBTITULOS', 'CONEXION', 'RITMO', 'OTRO');

-- CreateTable
CREATE TABLE "class_feedback" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "seguimiento" "SeguimientoClase" NOT NULL,
    "problemas" "ProblemaClase"[] NOT NULL DEFAULT ARRAY[]::"ProblemaClase"[],
    "comentario" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_feedback_booking_id_key" ON "class_feedback"("booking_id");

-- AddForeignKey
ALTER TABLE "class_feedback" ADD CONSTRAINT "class_feedback_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
