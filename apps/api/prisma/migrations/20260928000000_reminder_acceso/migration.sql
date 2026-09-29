-- El recordatorio sigue a la apertura del acceso (ya no es a los 30 min): se
-- renombra sin perder las marcas escritas. El índice parcial sigue a la columna.
ALTER TABLE "bookings" RENAME COLUMN "reminder_30m_sent_at" TO "reminder_acceso_sent_at";

ALTER INDEX "bookings_reminder_30m_pending_idx" RENAME TO "bookings_reminder_acceso_pending_idx";
