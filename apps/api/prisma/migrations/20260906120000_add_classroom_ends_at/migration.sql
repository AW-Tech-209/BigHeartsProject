-- `ends_at` = `scheduled_at + duration_minutes`. La escribe la app en cada
-- create/update (ver `finDelAula()` en `classrooms/coherencia-temporal.rules.ts`);
-- el CHECK de abajo es la red de seguridad, igual que
-- `classrooms_current_bookings_non_negative` (ver 20260827160000): si algún día
-- una fila queda con `ends_at` divergente (dato heredado, un bug futuro), el
-- INSERT/UPDATE falla en vez de mentir. La garantía primaria es el cálculo en la
-- app; ver `ARQUITECTURA.md` §7.2 y la decisión D40.
--
-- Existe porque «¿ya terminó?» —el corte pasado/futuro de «Mis clases», «Mis
-- aulas» y el historial— es una comparación sobre dos columnas que Prisma no
-- sabe expresar en un `where`. La editabilidad del aula sigue cortándose en
-- `scheduled_at` (§7.2, D16), no en esta columna.
ALTER TABLE "classrooms" ADD COLUMN "ends_at" TIMESTAMPTZ(3);

UPDATE "classrooms"
SET "ends_at" = "scheduled_at" + make_interval(mins => "duration_minutes");

ALTER TABLE "classrooms" ALTER COLUMN "ends_at" SET NOT NULL;

ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_ends_at_matches_schedule"
  CHECK ("ends_at" = "scheduled_at" + make_interval(mins => "duration_minutes"));
