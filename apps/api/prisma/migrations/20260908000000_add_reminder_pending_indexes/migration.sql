-- Prisma no modela índices parciales (ver 20260826120000_add_bookings).
-- El barrido de RemindersService filtra por status + marca de aviso vacía;
-- sin esto era un seq scan de toda la tabla cada minuto.
CREATE INDEX "bookings_reminder_24h_pending_idx" ON "bookings" ("classroom_id")
  WHERE "status" = 'CONFIRMED' AND "reminder_24h_sent_at" IS NULL;

CREATE INDEX "bookings_reminder_30m_pending_idx" ON "bookings" ("classroom_id")
  WHERE "status" = 'CONFIRMED' AND "reminder_30m_sent_at" IS NULL;
