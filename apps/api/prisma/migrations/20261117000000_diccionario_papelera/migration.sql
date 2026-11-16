-- Borrado lógico de unidades y categorías con entradas en la papelera (D52).
ALTER TABLE "dictionary_units" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "dictionary_categories" ADD COLUMN "deleted_at" TIMESTAMP(3);
