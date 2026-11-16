import { randomUUID } from 'node:crypto';

import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
  Optional,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  type ConfirmarVideoResponse,
  type EntradaSinSena,
  EstadoVideo,
  IMAGEN_TIPOS_PERMITIDOS,
  MINIATURA_TIPOS_PERMITIDOS,
  type SinSenaResponse,
  type SubidaImagenResponse,
  type SubidaVideoResponse,
  type TramoModulo,
  VIDEO_TIPOS_PERMITIDOS,
} from '@academia/types';

import { AlmacenamientoMedios, CLAVE_VALIDA } from '../../almacenamiento/almacenamiento-medios';
import { AppConfigService } from '../../config/app-config.service';
import {
  archivoDemasiadoGrande,
  entradaNotFound,
  subidaNoEncontrada,
  tipoDeArchivoNoPermitido,
  videoDemasiadoCorto,
  videoDemasiadoLargo,
  videoNotFound,
} from '../../diccionario/diccionario.errors';
import { PrismaService } from '../../prisma/prisma.service';
import { estadoSenaAdmin } from './admin-diccionario.mapper';
import type { SubidaImagenDto, SubidaVideoDto } from './dto/medios.dto';

/** Una subida que no se confirma en este tiempo se da por abandonada. */
export const SUBIDA_ABANDONADA_MS = 60 * 60 * 1000;
const INTERVALO_BARRIDO = 'barrido-subidas-diccionario';
const CADA_BARRIDO_MS = 10 * 60 * 1000;

@Injectable()
export class MediosService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly almacenamiento: AlmacenamientoMedios,
    private readonly config: AppConfigService,
    @Optional() private readonly scheduler?: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const intervalo = setInterval(() => void this.barrerSubidasAbandonadas(), CADA_BARRIDO_MS);
    this.scheduler?.addInterval(INTERVALO_BARRIDO, intervalo);
  }

  onModuleDestroy(): void {
    if (this.scheduler?.doesExist('interval', INTERVALO_BARRIDO)) {
      this.scheduler.deleteInterval(INTERVALO_BARRIDO);
    }
  }

  async iniciarSubidaVideo(
    entradaId: string,
    dto: SubidaVideoDto,
    subidoPorId: string,
  ): Promise<SubidaVideoResponse> {
    const limites = this.config.limitesMedios;
    if (!(VIDEO_TIPOS_PERMITIDOS as readonly string[]).includes(dto.tipo)) {
      throw tipoDeArchivoNoPermitido(VIDEO_TIPOS_PERMITIDOS);
    }
    if (!(MINIATURA_TIPOS_PERMITIDOS as readonly string[]).includes(dto.miniaturaTipo)) {
      throw tipoDeArchivoNoPermitido(MINIATURA_TIPOS_PERMITIDOS);
    }
    if (dto.bytes > limites.videoMaxBytes) throw archivoDemasiadoGrande(limites.videoMaxBytes);
    if (dto.duracionMs > limites.videoMaxMs) throw videoDemasiadoLargo(limites.videoMaxMs);
    if (dto.duracionMs < limites.videoMinMs) throw videoDemasiadoCorto(limites.videoMinMs);
    await this.entradaViva(entradaId);

    const id = randomUUID();
    const video = await this.prisma.signVideo.create({
      data: {
        id,
        entryId: entradaId,
        videoKey: `videos/${entradaId}/${id}.mp4`,
        miniaturaKey: `videos/${entradaId}/${id}.jpg`,
        duracionMs: dto.duracionMs,
        bytes: dto.bytes,
        estado: EstadoVideo.SUBIENDO,
        subidoPorId,
      },
    });

    const [urlVideo, urlMiniatura] = await Promise.all([
      this.almacenamiento.urlDeSubida(video.videoKey, dto.tipo, limites.videoMaxBytes),
      this.almacenamiento.urlDeSubida(
        video.miniaturaKey,
        dto.miniaturaTipo,
        limites.imagenMaxBytes,
      ),
    ]);
    return { videoId: video.id, video: urlVideo, miniatura: urlMiniatura };
  }

  /** Pasa a LISTO solo si los dos archivos llegaron; el anterior se retira en la misma transacción. */
  async confirmarVideo(entradaId: string, videoId: string): Promise<ConfirmarVideoResponse> {
    const limites = this.config.limitesMedios;
    const video = await this.prisma.signVideo.findFirst({
      where: { id: videoId, entryId: entradaId, estado: EstadoVideo.SUBIENDO },
    });
    if (!video) throw videoNotFound();

    const [archivo, miniatura] = await Promise.all([
      this.almacenamiento.metadatos(video.videoKey),
      this.almacenamiento.metadatos(video.miniaturaKey),
    ]);
    if (!archivo || !miniatura) throw subidaNoEncontrada();
    if (archivo.bytes > limites.videoMaxBytes || miniatura.bytes > limites.imagenMaxBytes) {
      await this.prisma.signVideo.update({
        where: { id: video.id },
        data: { estado: EstadoVideo.ERROR },
      });
      await this.borrarArchivos([video.videoKey, video.miniaturaKey]);
      throw archivoDemasiadoGrande(
        archivo.bytes > limites.videoMaxBytes ? limites.videoMaxBytes : limites.imagenMaxBytes,
      );
    }

    const anteriores = await this.prisma.$transaction(async (tx) => {
      const viejos = await tx.signVideo.findMany({
        where: {
          entryId: entradaId,
          lengua: video.lengua,
          id: { not: video.id },
          estado: { in: [EstadoVideo.LISTO, EstadoVideo.ERROR] },
        },
      });
      await tx.signVideo.deleteMany({ where: { id: { in: viejos.map((v) => v.id) } } });
      await tx.signVideo.update({
        where: { id: video.id },
        data: { estado: EstadoVideo.LISTO, bytes: archivo.bytes },
      });
      return viejos;
    });
    await this.borrarArchivos(anteriores.flatMap((v) => [v.videoKey, v.miniaturaKey]));

    return { videoId: video.id, estado: 'lista' };
  }

  async quitarVideo(entradaId: string): Promise<void> {
    await this.entradaViva(entradaId);
    const videos = await this.prisma.signVideo.findMany({ where: { entryId: entradaId } });
    await this.prisma.signVideo.deleteMany({ where: { entryId: entradaId } });
    await this.borrarArchivos(videos.flatMap((v) => [v.videoKey, v.miniaturaKey]));
  }

  /** Subidas sin confirmar tras 1 h: quedan en ERROR y sus archivos se borran. */
  async barrerSubidasAbandonadas(ahora = new Date()): Promise<number> {
    const abandonadas = await this.prisma.signVideo.findMany({
      where: {
        estado: EstadoVideo.SUBIENDO,
        createdAt: { lt: new Date(ahora.getTime() - SUBIDA_ABANDONADA_MS) },
      },
    });
    if (abandonadas.length === 0) return 0;
    await this.prisma.signVideo.updateMany({
      where: { id: { in: abandonadas.map((v) => v.id) } },
      data: { estado: EstadoVideo.ERROR },
    });
    await this.borrarArchivos(abandonadas.flatMap((v) => [v.videoKey, v.miniaturaKey]));
    return abandonadas.length;
  }

  async iniciarSubidaImagen(
    entradaId: string,
    dto: SubidaImagenDto,
  ): Promise<SubidaImagenResponse> {
    const { imagenMaxBytes } = this.config.limitesMedios;
    if (!(IMAGEN_TIPOS_PERMITIDOS as readonly string[]).includes(dto.tipo)) {
      throw tipoDeArchivoNoPermitido(IMAGEN_TIPOS_PERMITIDOS);
    }
    if (dto.bytes > imagenMaxBytes) throw archivoDemasiadoGrande(imagenMaxBytes);
    await this.entradaViva(entradaId);

    const clave = `imagenes/${entradaId}/${randomUUID()}.${dto.tipo === 'image/webp' ? 'webp' : 'jpg'}`;
    return {
      clave,
      imagen: await this.almacenamiento.urlDeSubida(clave, dto.tipo, imagenMaxBytes),
    };
  }

  async confirmarImagen(entradaId: string, clave: string): Promise<void> {
    const { imagenMaxBytes } = this.config.limitesMedios;
    const entrada = await this.entradaViva(entradaId);
    if (!CLAVE_VALIDA.test(clave) || !clave.startsWith(`imagenes/${entradaId}/`)) {
      throw subidaNoEncontrada();
    }

    const archivo = await this.almacenamiento.metadatos(clave);
    if (!archivo) throw subidaNoEncontrada();
    if (archivo.bytes > imagenMaxBytes) {
      await this.borrarArchivos([clave]);
      throw archivoDemasiadoGrande(imagenMaxBytes);
    }

    await this.prisma.dictionaryEntry.update({
      where: { id: entradaId },
      data: { imagenKey: clave },
    });
    if (entrada.imagenKey && entrada.imagenKey !== clave)
      await this.borrarArchivos([entrada.imagenKey]);
  }

  async quitarImagen(entradaId: string): Promise<void> {
    const entrada = await this.entradaViva(entradaId);
    if (!entrada.imagenKey) return;
    await this.prisma.dictionaryEntry.update({
      where: { id: entradaId },
      data: { imagenKey: null },
    });
    await this.borrarArchivos([entrada.imagenKey]);
  }

  /** Para la purga de la papelera: borra videos e imagen antes de borrar las entradas. */
  async borrarMediosDeEntradas(entradaIds: readonly string[]): Promise<void> {
    const ids = [...entradaIds];
    const [videos, entradas] = await Promise.all([
      this.prisma.signVideo.findMany({ where: { entryId: { in: ids } } }),
      this.prisma.dictionaryEntry.findMany({
        where: { id: { in: ids }, imagenKey: { not: null } },
        select: { imagenKey: true },
      }),
    ]);
    await this.prisma.signVideo.deleteMany({ where: { entryId: { in: ids } } });
    await this.borrarArchivos([
      ...videos.flatMap((v) => [v.videoKey, v.miniaturaKey]),
      ...entradas.flatMap((e) => (e.imagenKey ? [e.imagenKey] : [])),
    ]);
  }

  async sinSena(modulo?: number): Promise<SinSenaResponse> {
    const filas = await this.prisma.dictionaryEntry.findMany({
      where: {
        deletedAt: null,
        videos: { none: { estado: EstadoVideo.LISTO } },
        ...(modulo !== undefined && { module: { numero: modulo } }),
      },
      select: {
        id: true,
        slug: true,
        ingles: true,
        inglesNorm: true,
        module: { select: { numero: true, nombre: true, tramo: true } },
        unit: { select: { codigo: true, nombre: true, orden: true } },
        category: { select: { slug: true, nombre: true, icono: true } },
        videos: { select: { estado: true } },
      },
      orderBy: [{ module: { numero: 'asc' } }, { category: { orden: 'asc' } }, { orden: 'asc' }],
    });

    return {
      entradas: filas.map((f): EntradaSinSena => ({
        id: f.id,
        slug: f.slug,
        ingles: f.ingles,
        inglesNorm: f.inglesNorm,
        modulo: {
          numero: f.module.numero,
          nombre: f.module.nombre,
          tramo: f.module.tramo as TramoModulo,
        },
        unidad: f.unit ? { codigo: f.unit.codigo, nombre: f.unit.nombre } : null,
        categoria: f.category,
        sena: {
          estado: estadoSenaAdmin(
            f.videos.map((v) => v.estado),
          ) as EntradaSinSena['sena']['estado'],
        },
      })),
    };
  }

  /** `modulo, unidad, ingles, nombre_de_archivo` para nombrar los videos antes de grabar. */
  async sinSenaCsv(modulo?: number): Promise<string> {
    const { entradas } = await this.sinSena(modulo);
    const filas = entradas.map((e) =>
      [String(e.modulo.numero), e.unidad?.codigo ?? '', e.ingles, `${e.slug}.mp4`]
        .map(celdaCsv)
        .join(','),
    );
    return ['modulo,unidad,ingles,nombre_de_archivo', ...filas].join('\r\n') + '\r\n';
  }

  private async entradaViva(id: string) {
    const entrada = await this.prisma.dictionaryEntry.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, imagenKey: true },
    });
    if (!entrada) throw entradaNotFound();
    return entrada;
  }

  // Un archivo huérfano no rompe nada; un error aquí no debe deshacer lo ya confirmado.
  private async borrarArchivos(claves: string[]): Promise<void> {
    if (claves.length === 0) return;
    try {
      await this.almacenamiento.borrar(claves);
    } catch (error) {
      this.logger.warn(
        `No se pudieron borrar ${claves.length} archivos: ${(error as Error).message}`,
      );
    }
  }
}

function celdaCsv(valor: string): string {
  return /[",\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}
