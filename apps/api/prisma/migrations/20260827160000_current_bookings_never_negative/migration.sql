-- Prisma no modela CHECK en el schema, igual que el índice único parcial de
-- `bookings` (ver 20260826120000_add_bookings): red de seguridad si algún día
-- una fila queda con `current_bookings` negativo (dato heredado, un bug
-- futuro). La garantía primaria sigue siendo la transacción de §4.2.
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_current_bookings_non_negative" CHECK ("current_bookings" >= 0);
