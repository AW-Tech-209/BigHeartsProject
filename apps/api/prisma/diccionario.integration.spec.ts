import { randomUUID } from 'node:crypto';

import { EstadoVideo, UserRole, UserStatus } from '@academia/types';
import { Prisma, PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { sembrarDiccionario } from './seed-diccionario';

/** Contra la BD real con las migraciones aplicadas (igual que `bookings-index`). */
const url = process.env.DIRECT_URL;
if (!url)
  throw new Error(
    'Falta DIRECT_URL: estos tests requieren una BD real con las migraciones aplicadas.',
  );
const prisma = new PrismaClient({ datasources: { db: { url } } });

const ENTRADAS_POR_MODULO = { 1: 203, 2: 167, 3: 109 };

describe('diccionario contra la base de datos real', () => {
  const adminId = randomUUID();
  let slugsTrasPrimera: string[];

  beforeAll(async () => {
    await sembrarDiccionario(prisma);
    slugsTrasPrimera = (
      await prisma.dictionaryEntry.findMany({ select: { slug: true }, orderBy: { slug: 'asc' } })
    ).map((e) => e.slug);
    await prisma.user.create({
      data: {
        id: adminId,
        email: `admin-${adminId}@academia.local`,
        password: 'irrelevante',
        firstName: 'Ada',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
  });

  afterAll(async () => {
    await prisma.signVideo.deleteMany({ where: { subidoPorId: adminId } });
    await prisma.user.delete({ where: { id: adminId } });
    await prisma.$disconnect();
  });

  it('la migración deja 9 módulos, 15 unidades y 19 categorías', async () => {
    expect(await prisma.dictionaryModule.count()).toBe(9);
    expect(await prisma.dictionaryUnit.count()).toBe(15);
    expect(await prisma.dictionaryCategory.count()).toBe(19);
  });

  it('carga 479 entradas, 203 / 167 / 109 por módulo', async () => {
    expect(slugsTrasPrimera).toHaveLength(479);
    for (const [numero, total] of Object.entries(ENTRADAS_POR_MODULO)) {
      expect(
        await prisma.dictionaryEntry.count({ where: { module: { numero: Number(numero) } } }),
      ).toBe(total);
    }
    const acciones = await Promise.all(
      [1, 2, 3].map((numero) =>
        prisma.dictionaryEntry.count({
          where: { module: { numero }, category: { slug: 'acciones' } },
        }),
      ),
    );
    expect(acciones).toEqual([51, 42, 9]);
  });

  it('una segunda corrida no crea filas ni cambia slugs', async () => {
    const resultado = await sembrarDiccionario(prisma);

    expect(resultado).toEqual({ creadas: 0, existentes: 479 });
    const slugs = (
      await prisma.dictionaryEntry.findMany({ select: { slug: true }, orderBy: { slug: 'asc' } })
    ).map((e) => e.slug);
    expect(slugs).toEqual(slugsTrasPrimera);
  });

  it('la búsqueda trigram usa el índice y tolera errores y tildes', async () => {
    const [plan, eat, lapiz] = await prisma
      .$transaction([
        prisma.$executeRaw`SET LOCAL enable_seqscan = off`,
        prisma.$queryRaw<
          { 'QUERY PLAN': string }[]
        >`EXPLAIN SELECT id FROM dictionary_entries WHERE ingles_norm % 'to eet'`,
        prisma.$queryRaw<
          { ingles: string }[]
        >`SELECT ingles FROM dictionary_entries WHERE ingles_norm % 'to eet'`,
        prisma.$queryRaw<
          { espanol: string }[]
        >`SELECT espanol FROM dictionary_entries WHERE espanol_norm % 'lapiz'`,
      ])
      .then(([, p, e, l]) => [p, e, l] as const);

    expect(plan.map((f) => f['QUERY PLAN']).join('\n')).toContain(
      'dictionary_entries_ingles_norm_trgm_idx',
    );
    expect(eat.map((f) => f.ingles)).toContain('To eat');
    expect(lapiz.map((f) => f.espanol)).toContain('Lápiz');
  });

  it('no admite dos videos activos para la misma entrada y lengua', async () => {
    const entrada = await prisma.dictionaryEntry.findFirstOrThrow({ where: { slug: 'to-eat' } });
    const video = (estado: EstadoVideo) => ({
      entryId: entrada.id,
      videoKey: `${randomUUID()}.mp4`,
      miniaturaKey: `${randomUUID()}.jpg`,
      duracionMs: 3000,
      bytes: 1000,
      estado,
      subidoPorId: adminId,
    });

    await prisma.signVideo.create({ data: video(EstadoVideo.LISTO) });
    await prisma.signVideo.create({ data: video(EstadoVideo.SUBIENDO) });

    await expect(
      prisma.signVideo.create({ data: video(EstadoVideo.LISTO) }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });
});
