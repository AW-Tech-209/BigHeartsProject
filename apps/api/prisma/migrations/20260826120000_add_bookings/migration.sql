-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "cancelled_at" TIMESTAMP(3),
    "reminder_24h_sent_at" TIMESTAMP(3),
    "reminder_30m_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_student_id_idx" ON "bookings"("student_id");

-- CreateIndex
CREATE INDEX "bookings_classroom_id_idx" ON "bookings"("classroom_id");

-- CreateIndex
--
-- PARCIAL a propósito (ARQUITECTURA.md §4.3, skill bighearts-backend →
-- reglas-reservas.md §3): un índice único TOTAL sobre (student_id,
-- classroom_id) impediría que un estudiante que canceló volviera a reservar la
-- misma aula, porque la fila CANCELLED seguiría ocupando el índice. Prisma no
-- modela un WHERE en @@unique, así que esta línea se escribió a mano añadiendo
-- la cláusula al CREATE UNIQUE INDEX que `prisma migrate dev` habría generado
-- para el `@@unique([studentId, classroomId])` del schema. Es una red de
-- seguridad por si la lógica de aplicación falla; la garantía primaria es la
-- transacción de §4.2.
CREATE UNIQUE INDEX "bookings_active_uniq" ON "bookings"("student_id", "classroom_id") WHERE "status" = 'CONFIRMED';

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
