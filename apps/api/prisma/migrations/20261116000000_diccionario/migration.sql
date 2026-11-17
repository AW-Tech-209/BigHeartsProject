-- pg_trgm para la búsqueda tolerante a errores (D50). Sin unaccent: no es inmutable y en
-- Supabase vive en otro esquema; por eso se guardan columnas normalizadas.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "TramoModulo" AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO');

-- CreateEnum
CREATE TYPE "EstadoModulo" AS ENUM ('DISPONIBLE', 'PROXIMAMENTE');

-- CreateEnum
CREATE TYPE "TipoEntrada" AS ENUM ('PALABRA', 'VERBO', 'FRASE', 'EXPRESION');

-- CreateEnum
CREATE TYPE "LenguaSenas" AS ENUM ('LSC');

-- CreateEnum
CREATE TYPE "EstadoVideo" AS ENUM ('SUBIENDO', 'PROCESANDO', 'LISTO', 'ERROR');

-- CreateTable
CREATE TABLE "dictionary_modules" (
    "id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tramo" "TramoModulo" NOT NULL,
    "estado" "EstadoModulo" NOT NULL,
    "orden" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictionary_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dictionary_units" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictionary_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dictionary_categories" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icono" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictionary_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dictionary_entries" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "ingles" TEXT NOT NULL,
    "espanol" TEXT NOT NULL,
    "ingles_norm" TEXT NOT NULL,
    "espanol_norm" TEXT NOT NULL,
    "tipo" "TipoEntrada" NOT NULL,
    "module_id" UUID NOT NULL,
    "unit_id" UUID,
    "category_id" UUID NOT NULL,
    "imagen_key" TEXT,
    "nota" TEXT,
    "orden" INTEGER NOT NULL,
    "publicada" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictionary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_videos" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "lengua" "LenguaSenas" NOT NULL DEFAULT 'LSC',
    "video_key" TEXT NOT NULL,
    "miniatura_key" TEXT NOT NULL,
    "duracion_ms" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "estado" "EstadoVideo" NOT NULL DEFAULT 'SUBIENDO',
    "subido_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sign_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dictionary_modules_numero_key" ON "dictionary_modules"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "dictionary_units_module_id_codigo_key" ON "dictionary_units"("module_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "dictionary_categories_slug_key" ON "dictionary_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "dictionary_entries_slug_key" ON "dictionary_entries"("slug");

-- CreateIndex
CREATE INDEX "dictionary_entries_ingles_norm_trgm_idx" ON "dictionary_entries" USING GIN ("ingles_norm" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "dictionary_entries_espanol_norm_trgm_idx" ON "dictionary_entries" USING GIN ("espanol_norm" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "sign_videos_entry_id_idx" ON "sign_videos"("entry_id");

-- AddForeignKey
ALTER TABLE "dictionary_units" ADD CONSTRAINT "dictionary_units_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "dictionary_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictionary_entries" ADD CONSTRAINT "dictionary_entries_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "dictionary_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictionary_entries" ADD CONSTRAINT "dictionary_entries_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "dictionary_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictionary_entries" ADD CONSTRAINT "dictionary_entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "dictionary_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_videos" ADD CONSTRAINT "sign_videos_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "dictionary_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_videos" ADD CONSTRAINT "sign_videos_subido_por_id_fkey" FOREIGN KEY ("subido_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Listados de lectura por módulo y categoría, sin la papelera. Parcial: solo en SQL.
CREATE INDEX "dictionary_entries_module_category_vivas_idx"
    ON "dictionary_entries" ("module_id", "category_id")
    WHERE "deleted_at" IS NULL;

-- Un solo video activo (LISTO) por entrada y lengua. Parcial: solo en SQL.
CREATE UNIQUE INDEX "sign_videos_activo_uniq"
    ON "sign_videos" ("entry_id", "lengua")
    WHERE "estado" = 'LISTO';

-- Datos de referencia: iguales en todos los entornos (ESTRATEGIA.md §2).
INSERT INTO "dictionary_modules" ("id", "numero", "nombre", "tramo", "estado", "orden", "updated_at") VALUES
    (gen_random_uuid(), 1, 'Level I',    'BASICO',     'DISPONIBLE',   1, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 2, 'Level II',   'BASICO',     'DISPONIBLE',   2, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 3, 'Level III',  'BASICO',     'DISPONIBLE',   3, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 4, 'Level IV',   'INTERMEDIO', 'PROXIMAMENTE', 4, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 5, 'Level V',    'INTERMEDIO', 'PROXIMAMENTE', 5, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 6, 'Level VI',   'INTERMEDIO', 'PROXIMAMENTE', 6, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 7, 'Level VII',  'AVANZADO',   'PROXIMAMENTE', 7, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 8, 'Level VIII', 'AVANZADO',   'PROXIMAMENTE', 8, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 9, 'Level IX',   'AVANZADO',   'PROXIMAMENTE', 9, CURRENT_TIMESTAMP);

INSERT INTO "dictionary_units" ("id", "module_id", "codigo", "nombre", "orden", "updated_at")
SELECT gen_random_uuid(), m."id", u."codigo", u."nombre", u."orden", CURRENT_TIMESTAMP
FROM (VALUES
    (1, 'U1', 'Need, Want', 1),
    (1, 'U2', 'What, Where, When', 2),
    (1, 'U3', 'Wish', 3),
    (1, 'U4', 'Then and to do', 4),
    (1, 'U5', 'Have', 5),
    (1, 'U6', 'Talking about my family and me', 6),
    (2, 'U1', 'Present progressive', 1),
    (2, 'U2', 'Future with going', 2),
    (2, 'U3', 'Future with will', 3),
    (2, 'U4', 'Planning my vacation', 4),
    (3, 'U1', 'To be, Who', 1),
    (3, 'U2', 'It', 2),
    (3, 'U3', 'Which', 3),
    (3, 'U4', 'Why and because', 4),
    (3, 'U5', 'Why is it important to be a good professional?', 5)
) AS u ("numero", "codigo", "nombre", "orden")
JOIN "dictionary_modules" m ON m."numero" = u."numero";

INSERT INTO "dictionary_categories" ("id", "nombre", "slug", "icono", "orden", "updated_at") VALUES
    (gen_random_uuid(), 'Acciones',              'acciones',              'activity',                1, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Lugares',               'lugares',               'map-pin',                 2, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Pronombres e ideas',    'pronombres-e-ideas',    'puzzle',                  3, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Cómo es',               'como-es',               'sparkles',                4, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Tiempo y fechas',       'tiempo-y-fechas',       'clock',                   5, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Expresiones',           'expresiones',           'quote',                   6, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Objetos',               'objetos',               'lamp',                    7, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Palabras de enlace',    'palabras-de-enlace',    'link',                    8, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Familia y personas',    'familia-y-personas',    'users',                   9, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Escuela e idiomas',     'escuela-e-idiomas',     'graduation-cap',         10, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Fiestas y deportes',    'fiestas-y-deportes',    'party-popper',           11, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Profesiones y trabajo', 'profesiones-y-trabajo', 'briefcase',              12, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Dinero y compras',      'dinero-y-compras',      'wallet',                 13, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Comida y frutas',       'comida-y-frutas',       'apple',                  14, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Transporte y viajes',   'transporte-y-viajes',   'bus',                    15, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Preguntas',             'preguntas',             'message-circle-question', 16, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Colores',               'colores',               'palette',                17, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Números',               'numeros',               'hash',                   18, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Ropa',                  'ropa',                  'shirt',                  19, CURRENT_TIMESTAMP);
