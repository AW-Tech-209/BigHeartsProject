import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';

import {
  AccionLote,
  ApiErrorCode,
  EstadoVideo,
  TipoEntrada,
  UserRole,
  UserStatus,
} from '@academia/types';
import { Prisma, PrismaClient } from '@prisma/client';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { AdminDiccionarioService } from '../src/admin/diccionario/admin-diccionario.service';
import { MediosService, SUBIDA_ABANDONADA_MS } from '../src/admin/diccionario/medios.service';
import { LocalAlmacenamientoService } from '../src/almacenamiento/local-almacenamiento.service';
import type { AppConfigService } from '../src/config/app-config.service';
import { DiccionarioService } from '../src/diccionario/diccionario.service';
import type { PrismaService } from '../src/prisma/prisma.service';
import { sembrarDiccionario } from './seed-diccionario';

/** Contra la BD real con las migraciones aplicadas (igual que `bookings-index`). */
const url = process.env.DIRECT_URL;
if (!url)
  throw new Error(
    'Falta DIRECT_URL: estos tests requieren una BD real con las migraciones aplicadas.',
  );
const prisma = new PrismaClient({ datasources: { db: { url } } });

/** Medios en una carpeta temporal con el adaptador local (D51). */
const carpetaMedios = mkdtempSync(join(tmpdir(), 'bighearts-medios-'));
const almacenamiento = new LocalAlmacenamientoService(
  'secreto-de-prueba',
  'http://localhost:3000',
  carpetaMedios,
);

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
    rmSync(carpetaMedios, { recursive: true, force: true });
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

  describe('lectura (cualquier rol con sesión)', () => {
    const servicio = new DiccionarioService(prisma as unknown as PrismaService, almacenamiento);

    class Revertir extends Error {}
    /** Crea datos dentro de una transacción que se revierte: no ensucia los conteos de otros tests. */
    async function conDatosTemporales(
      fn: (svc: DiccionarioService, tx: Prisma.TransactionClient) => Promise<void>,
    ): Promise<void> {
      await prisma
        .$transaction(async (tx) => {
          await fn(new DiccionarioService(tx as unknown as PrismaService, almacenamiento), tx);
          throw new Revertir();
        })
        .catch((e: unknown) => {
          if (!(e instanceof Revertir)) throw e;
        });
    }

    async function codigoDe(promesa: Promise<unknown>): Promise<string | undefined> {
      const error = await promesa.then(
        () => undefined,
        (e: { getResponse?: () => { code?: string } }) => e,
      );
      return error?.getResponse?.().code;
    }

    it('el inicio trae los 9 módulos; el 1 con 203 palabras y los próximos en 0', async () => {
      const { modulos } = await servicio.inicio();

      expect(modulos.map((m) => m.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(modulos[0]?.palabras).toBe(203);
      expect(modulos[3]?.palabras).toBe(0);
    });

    it('el módulo ordena sus categorías por cantidad y un módulo próximo responde MODULE_NOT_AVAILABLE', async () => {
      const modulo = await servicio.modulo(1, {});

      expect(modulo.categorias[0]).toMatchObject({ slug: 'acciones', palabras: 51 });
      const conteos = modulo.categorias.map((c) => c.palabras);
      expect(conteos).toEqual([...conteos].sort((a, b) => b - a));
      expect(modulo.unidades).toHaveLength(6);
      expect(await codigoDe(servicio.modulo(4, {}))).toBe(ApiErrorCode.MODULE_NOT_AVAILABLE);
    });

    it('Módulo 1 · Acciones: solo VERBO 51, y la unidad U1 deja 16', async () => {
      const todas = await servicio.categoria(1, 'acciones', {});
      const u1 = await servicio.categoria(1, 'acciones', { unidad: 'U1' });

      expect(todas.filtros.tipos).toEqual({ [TipoEntrada.VERBO]: 51 });
      expect(u1.entradas).toHaveLength(16);
      expect(todas.entradas.slice(0, 3).map((e) => e.slug)).toEqual([
        'to-eat',
        'to-drink',
        'to-read',
      ]);
    });

    it('la entrada trae su posición y sus vecinas en el mismo orden', async () => {
      const drink = await servicio.entrada('to-drink');
      const eat = await servicio.entrada('to-eat');

      expect(drink.posicion).toEqual({ actual: 2, total: 51 });
      expect(drink.anterior?.ingles).toBe('To eat');
      expect(drink.siguiente?.ingles).toBe('To read');
      expect(eat.anterior).toBeNull();
    });

    it.each([
      ['comer', 'To eat'],
      ['lapiz', 'Pencil'],
      ['to eet', 'To eat'],
    ])('buscar «%s» encuentra «%s»', async (q, ingles) => {
      const { resultados } = await servicio.buscar({ q });

      expect(resultados.map((r) => r.ingles)).toContain(ingles);
    });

    it('lo de la papelera, lo oculto y lo de un módulo próximo no aparece en ninguna lectura', async () => {
      await conDatosTemporales(async (svc, tx) => {
        const [m1, m4, acciones] = await Promise.all([
          tx.dictionaryModule.findUniqueOrThrow({ where: { numero: 1 } }),
          tx.dictionaryModule.findUniqueOrThrow({ where: { numero: 4 } }),
          tx.dictionaryCategory.findUniqueOrThrow({ where: { slug: 'acciones' } }),
        ]);
        const base = {
          espanol: 'Oculta',
          espanolNorm: 'oculta',
          tipo: TipoEntrada.VERBO,
          categoryId: acciones.id,
          orden: 0,
        };
        await tx.dictionaryEntry.createMany({
          data: [
            {
              ...base,
              slug: 'zzoculta-papelera',
              ingles: 'Zzoculta papelera',
              inglesNorm: 'zzoculta papelera',
              moduleId: m1.id,
              deletedAt: new Date(),
            },
            {
              ...base,
              slug: 'zzoculta-no-publicada',
              ingles: 'Zzoculta no publicada',
              inglesNorm: 'zzoculta no publicada',
              moduleId: m1.id,
              publicada: false,
            },
            {
              ...base,
              slug: 'zzoculta-proxima',
              ingles: 'Zzoculta proxima',
              inglesNorm: 'zzoculta proxima',
              moduleId: m4.id,
            },
          ],
        });

        expect((await svc.inicio()).modulos.map((m) => m.palabras).slice(0, 4)).toEqual([
          203, 167, 109, 0,
        ]);
        expect((await svc.categoria(1, 'acciones', {})).filtros.total).toBe(51);
        expect((await svc.modulo(1, {})).modulo.palabras).toBe(203);
        expect((await svc.buscar({ q: 'zzoculta' })).resultados).toEqual([]);
        for (const slug of ['zzoculta-papelera', 'zzoculta-no-publicada', 'zzoculta-proxima']) {
          expect(await codigoDe(svc.entrada(slug))).toBe(ApiErrorCode.ENTRY_NOT_FOUND);
        }
      });
    });

    it('ninguna respuesta filtra campos internos ni estados del video que no sean «lista»', async () => {
      await conDatosTemporales(async (svc, tx) => {
        const read = await tx.dictionaryEntry.findUniqueOrThrow({ where: { slug: 'to-read' } });
        await tx.signVideo.create({
          data: {
            entryId: read.id,
            videoKey: 'secreto.mp4',
            miniaturaKey: 'secreto.jpg',
            duracionMs: 3000,
            bytes: 1,
            estado: EstadoVideo.PROCESANDO,
            subidoPorId: adminId,
          },
        });

        const entrada = await svc.entrada('to-read');
        const respuestas = JSON.stringify([
          await svc.inicio(),
          await svc.modulo(1, {}),
          await svc.categoria(1, 'acciones', {}),
          entrada,
          await svc.buscar({ q: 'read' }),
        ]);

        expect(entrada.sena.estado).toBe('en-preparacion');
        for (const prohibido of [
          'deletedAt',
          'publicada',
          '"videoKey"',
          '"miniaturaKey"',
          '"imagenKey"',
          'secreto',
          'PROCESANDO',
          'ERROR',
          'SUBIENDO',
        ]) {
          expect(respuestas).not.toContain(prohibido);
        }
      });
    });
  });

  describe('gestión (solo ADMIN)', () => {
    const admin = new AdminDiccionarioService(prisma as unknown as PrismaService);
    const lectura = new DiccionarioService(prisma as unknown as PrismaService, almacenamiento);
    const creadas: string[] = [];

    afterEach(async () => {
      await prisma.dictionaryEntry.deleteMany({ where: { id: { in: creadas.splice(0) } } });
    });

    async function codigo(promesa: Promise<unknown>): Promise<string | undefined> {
      const error = await promesa.then(
        () => undefined,
        (e: { getResponse?: () => { code?: string } }) => e,
      );
      return error?.getResponse?.().code;
    }

    async function referencias() {
      const [m1, m2, acciones, lugares] = await Promise.all([
        prisma.dictionaryModule.findUniqueOrThrow({
          where: { numero: 1 },
          include: { unidades: true },
        }),
        prisma.dictionaryModule.findUniqueOrThrow({
          where: { numero: 2 },
          include: { unidades: true },
        }),
        prisma.dictionaryCategory.findUniqueOrThrow({ where: { slug: 'acciones' } }),
        prisma.dictionaryCategory.findUniqueOrThrow({ where: { slug: 'lugares' } }),
      ]);
      return { m1, m2, acciones, lugares };
    }

    async function crear(ingles: string, moduloId: string, categoriaId: string) {
      const e = await admin.crear({
        ingles,
        espanol: 'Prueba',
        tipo: TipoEntrada.VERBO,
        moduloId,
        categoriaId,
      });
      creadas.push(e.id);
      return e;
    }

    it('filtra por módulo, categoría y seña, y los chips suman el total de la categoría', async () => {
      const r = await admin.listar({
        modulo: 1,
        categoria: 'acciones',
        sena: 'sin-sena',
        pageSize: 100,
      });
      const suma = Object.values(r.conteosSena).reduce((a, b) => a + b, 0);

      expect(
        r.items.every((e) => e.sena.estado === 'sin-sena' && e.categoria.slug === 'acciones'),
      ).toBe(true);
      expect(r.total).toBe(r.conteosSena['sin-sena']);
      expect(suma).toBe(51);
    });

    it('una unidad de otro módulo responde UNIT_NOT_IN_MODULE', async () => {
      const { m1, m2, acciones } = await referencias();
      const unidadDelM1 = m1.unidades[0]?.id;

      expect(
        await codigo(
          admin.crear({
            ingles: 'Zz',
            espanol: 'Zz',
            tipo: TipoEntrada.VERBO,
            moduloId: m2.id,
            unidadId: unidadDelM1,
            categoriaId: acciones.id,
          }),
        ),
      ).toBe(ApiErrorCode.UNIT_NOT_IN_MODULE);
    });

    it('editar el inglés no cambia el slug y la lectura lo ve al instante', async () => {
      const drink = await prisma.dictionaryEntry.findUniqueOrThrow({ where: { slug: 'to-drink' } });
      try {
        const editada = await admin.editar(drink.id, { ingles: 'To drink (water)' });

        expect(editada.slug).toBe('to-drink');
        expect((await lectura.entrada('to-drink')).ingles).toBe('To drink (water)');
        expect((await lectura.buscar({ q: 'water' })).resultados.map((r) => r.slug)).toContain(
          'to-drink',
        );
      } finally {
        await admin.editar(drink.id, { ingles: drink.ingles });
      }
    });

    it('crear «To drink» en el Módulo 2 funciona y duplicados avisa del Módulo 1', async () => {
      const { m2, acciones } = await referencias();
      const nueva = await crear('To drink', m2.id, acciones.id);
      const { duplicados } = await admin.duplicados({ ingles: 'to  DRINK', excluir: nueva.id });

      expect(nueva.slug).toBe('to-drink-2');
      expect(duplicados.map((d) => d.modulo.numero)).toEqual([1]);
    });

    it('una entrada nueva va al final del orden de su categoría y módulo', async () => {
      const { m1, acciones } = await referencias();
      const nueva = await crear('Zz to last', m1.id, acciones.id);
      const { _max } = await prisma.dictionaryEntry.aggregate({
        where: { moduleId: m1.id, categoryId: acciones.id, id: { not: nueva.id } },
        _max: { orden: true },
      });

      expect(nueva.orden).toBe((_max.orden ?? 0) + 1);
    });

    it('el lote mueve las dos o, si una no existe, ninguna', async () => {
      const { m1, acciones, lugares } = await referencias();
      const a = await crear('Zz lote a', m1.id, acciones.id);
      const b = await crear('Zz lote b', m1.id, acciones.id);

      expect(
        await codigo(
          admin.lote({
            ids: [a.id, b.id, randomUUID()],
            accion: AccionLote.MOVER_CATEGORIA,
            categoriaId: lugares.id,
          }),
        ),
      ).toBe(ApiErrorCode.ENTRY_NOT_FOUND);
      expect((await admin.obtener(a.id)).categoria.slug).toBe('acciones');

      await admin.lote({
        ids: [a.id, b.id],
        accion: AccionLote.MOVER_CATEGORIA,
        categoriaId: lugares.id,
      });
      expect((await admin.obtener(a.id)).categoria.slug).toBe('lugares');
      expect((await admin.obtener(b.id)).categoria.slug).toBe('lugares');
    });

    it('una entrada oculta deja de verse en la lectura', async () => {
      const { m1, acciones } = await referencias();
      const e = await crear('Zz oculta', m1.id, acciones.id);

      await admin.lote({ ids: [e.id], accion: AccionLote.OCULTAR });

      expect(await codigo(lectura.entrada(e.slug))).toBe(ApiErrorCode.ENTRY_NOT_FOUND);
    });
  });

  describe('medios: señas e imágenes (adaptador local)', () => {
    const MB = 1024 * 1024;
    const config = {
      limitesMedios: {
        videoMaxBytes: 20 * MB,
        videoMinMs: 2000,
        videoMaxMs: 15000,
        imagenMaxBytes: 800 * 1024,
      },
    } as unknown as AppConfigService;
    const medios = new MediosService(prisma as unknown as PrismaService, almacenamiento, config);
    const lectura = new DiccionarioService(prisma as unknown as PrismaService, almacenamiento);
    let drinkId: string;

    beforeAll(async () => {
      drinkId = (await prisma.dictionaryEntry.findUniqueOrThrow({ where: { slug: 'to-drink' } }))
        .id;
    });

    afterEach(async () => {
      await medios.quitarVideo(drinkId);
      await medios.quitarImagen(drinkId);
    });

    async function error(promesa: Promise<unknown>) {
      return promesa.then(
        () => undefined,
        (e: { getStatus: () => number; getResponse: () => { code?: string } }) => ({
          status: e.getStatus(),
          code: e.getResponse().code,
        }),
      );
    }

    const pedido = (bytes: number, duracionMs = 4000) =>
      ({ tipo: 'video/mp4', bytes, duracionMs, miniaturaTipo: 'image/jpeg' }) as const;

    async function subirA(url: string, bytes: number): Promise<void> {
      const permiso = almacenamiento.verificar(new URL(url).searchParams.get('t') ?? '', 'subir');
      if (!permiso) throw new Error('permiso de subida inválido');
      await almacenamiento.guardar(permiso, Readable.from([Buffer.alloc(bytes)]));
    }

    /** Lo que haría el navegador con las URLs firmadas: subir los dos archivos. */
    async function subirArchivos(urls: { video: { url: string }; miniatura: { url: string } }) {
      await subirA(urls.video.url, 2048);
      await subirA(urls.miniatura.url, 512);
    }

    it('admite 19 MB y rechaza 21 MB (FILE_TOO_LARGE) y 16 s (VIDEO_TOO_LONG)', async () => {
      await expect(
        medios.iniciarSubidaVideo(drinkId, pedido(19 * MB), adminId),
      ).resolves.toHaveProperty('videoId');
      expect(await error(medios.iniciarSubidaVideo(drinkId, pedido(21 * MB), adminId))).toEqual({
        status: 400,
        code: ApiErrorCode.FILE_TOO_LARGE,
      });
      expect(await error(medios.iniciarSubidaVideo(drinkId, pedido(MB, 16000), adminId))).toEqual({
        status: 400,
        code: ApiErrorCode.VIDEO_TOO_LONG,
      });
    });

    it('confirmar sin que el archivo haya llegado responde 409 UPLOAD_NOT_FOUND', async () => {
      const { videoId } = await medios.iniciarSubidaVideo(drinkId, pedido(MB), adminId);

      expect(await error(medios.confirmarVideo(drinkId, videoId))).toEqual({
        status: 409,
        code: ApiErrorCode.UPLOAD_NOT_FOUND,
      });
    });

    it('subir y confirmar deja la seña lista con URL firmada y sube conSena del Módulo 1 en 1', async () => {
      const antes = (await lectura.inicio()).modulos[0]?.conSena ?? 0;
      const subida = await medios.iniciarSubidaVideo(drinkId, pedido(MB), adminId);
      await subirArchivos(subida);

      await medios.confirmarVideo(drinkId, subida.videoId);
      const entrada = await lectura.entrada('to-drink');

      expect(entrada.sena.estado).toBe('lista');
      const token = new URL(entrada.sena.url ?? 'http://x').searchParams.get('t') ?? '';
      const permiso = almacenamiento.verificar(token, 'leer');
      expect(await almacenamiento.metadatos(permiso?.clave ?? '')).toEqual({ bytes: 2048 });
      expect((await lectura.inicio()).modulos[0]?.conSena).toBe(antes + 1);
      expect(JSON.stringify(entrada)).not.toMatch(/"(videoKey|miniaturaKey|imagenKey)"/);
    });

    it('reemplazar deja un solo video activo y borra los archivos anteriores', async () => {
      const primera = await medios.iniciarSubidaVideo(drinkId, pedido(MB), adminId);
      await subirArchivos(primera);
      await medios.confirmarVideo(drinkId, primera.videoId);
      const vieja = await prisma.signVideo.findUniqueOrThrow({ where: { id: primera.videoId } });

      const segunda = await medios.iniciarSubidaVideo(drinkId, pedido(MB), adminId);
      await subirArchivos(segunda);
      await medios.confirmarVideo(drinkId, segunda.videoId);

      const activos = await prisma.signVideo.findMany({
        where: { entryId: drinkId, estado: EstadoVideo.LISTO },
      });
      expect(activos.map((v) => v.id)).toEqual([segunda.videoId]);
      expect(await almacenamiento.metadatos(vieja.videoKey)).toBeNull();
      expect(await almacenamiento.metadatos(vieja.miniaturaKey)).toBeNull();
    });

    it('la imagen se confirma solo si llegó, y la lectura la firma', async () => {
      const { clave, imagen } = await medios.iniciarSubidaImagen(drinkId, {
        tipo: 'image/webp',
        bytes: 1000,
      });
      expect((await error(medios.confirmarImagen(drinkId, clave)))?.code).toBe(
        ApiErrorCode.UPLOAD_NOT_FOUND,
      );

      await subirA(imagen.url, 1000);
      await medios.confirmarImagen(drinkId, clave);

      expect((await lectura.entrada('to-drink')).imagenUrl).toContain(
        '/almacenamiento-local/leer?t=',
      );
    });

    it('el barrido pasa a ERROR lo que sigue SUBIENDO tras 1 h', async () => {
      const { videoId } = await medios.iniciarSubidaVideo(drinkId, pedido(MB), adminId);

      await medios.barrerSubidasAbandonadas(new Date(Date.now() + SUBIDA_ABANDONADA_MS + 1000));

      expect((await prisma.signVideo.findUniqueOrThrow({ where: { id: videoId } })).estado).toBe(
        EstadoVideo.ERROR,
      );
    });
  });
});
