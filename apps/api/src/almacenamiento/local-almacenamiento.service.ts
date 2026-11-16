import { createHmac, timingSafeEqual } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import type { UrlDeSubida } from '@academia/types';

import { AlmacenamientoMedios, CLAVE_VALIDA, type MetadatosObjeto } from './almacenamiento-medios';

/** Lo que firma el token de una URL local: la operación, la clave y su caducidad. */
export interface PermisoLocal {
  op: 'subir' | 'leer';
  clave: string;
  exp: number;
  tipo?: string;
  max?: number;
}

const VIDA_SUBIDA_SEGUNDOS = 2 * 60 * 60;

export class ArchivoDemasiadoGrande extends Error {}

/**
 * Adaptador de disco para desarrollo y tests: `apps/api/storage/`. Sube y lee por
 * `/almacenamiento-local/*` con un token HMAC, así el flujo es el mismo que con Supabase.
 */
export class LocalAlmacenamientoService extends AlmacenamientoMedios {
  readonly nombre = 'disco local';

  constructor(
    private readonly secreto: string,
    private readonly baseUrl: string,
    private readonly carpeta = resolve(__dirname, '..', '..', 'storage'),
  ) {
    super();
  }

  async urlDeSubida(clave: string, tipo: string, maxBytes: number): Promise<UrlDeSubida> {
    const token = this.firmar({
      op: 'subir',
      clave,
      tipo,
      max: maxBytes,
      exp: ahora() + VIDA_SUBIDA_SEGUNDOS,
    });
    return {
      url: `${this.baseUrl}/almacenamiento-local/subir?t=${token}`,
      metodo: 'PUT',
      headers: { 'Content-Type': tipo },
    };
  }

  async urlsDeLectura(
    claves: readonly string[],
    ttlSegundos: number,
  ): Promise<Map<string, string>> {
    const exp = ahora() + ttlSegundos;
    return new Map(
      claves.map((clave) => [
        clave,
        `${this.baseUrl}/almacenamiento-local/leer?t=${this.firmar({ op: 'leer', clave, exp })}`,
      ]),
    );
  }

  async metadatos(clave: string): Promise<MetadatosObjeto | null> {
    try {
      const info = await stat(this.ruta(clave));
      return info.isFile() ? { bytes: info.size } : null;
    } catch {
      return null;
    }
  }

  async borrar(claves: readonly string[]): Promise<void> {
    // Una clave inválida no puede existir en disco: no hay nada que borrar.
    const validas = claves.filter((clave) => CLAVE_VALIDA.test(clave));
    await Promise.all(validas.map((clave) => rm(this.ruta(clave), { force: true })));
  }

  /** Escribe lo que llega por la URL de subida, cortando si pasa del máximo firmado. */
  async guardar(permiso: PermisoLocal, cuerpo: Readable): Promise<void> {
    const destino = this.ruta(permiso.clave);
    await mkdir(dirname(destino), { recursive: true });
    let bytes = 0;
    const max = permiso.max ?? 0;
    cuerpo.on('data', (trozo: Buffer) => {
      bytes += trozo.length;
      if (bytes > max) cuerpo.destroy(new ArchivoDemasiadoGrande());
    });
    try {
      await pipeline(cuerpo, createWriteStream(destino));
    } catch (error) {
      await rm(destino, { force: true });
      throw error;
    }
  }

  ruta(clave: string): string {
    if (!CLAVE_VALIDA.test(clave)) throw new Error(`Clave de almacenamiento inválida: ${clave}`);
    const ruta = resolve(join(this.carpeta, clave));
    if (!ruta.startsWith(this.carpeta + sep)) throw new Error('Clave fuera del almacenamiento');
    return ruta;
  }

  /** `null` si el token no es nuestro, caducó o no es para esta operación. */
  verificar(token: string, op: PermisoLocal['op']): PermisoLocal | null {
    const [datos, firma] = token.split('.');
    if (!datos || !firma) return null;
    const esperada = Buffer.from(this.hmac(datos));
    const recibida = Buffer.from(firma);
    if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
    try {
      const permiso = JSON.parse(Buffer.from(datos, 'base64url').toString('utf8')) as PermisoLocal;
      return permiso.op === op && permiso.exp > ahora() && CLAVE_VALIDA.test(permiso.clave)
        ? permiso
        : null;
    } catch {
      return null;
    }
  }

  private firmar(permiso: PermisoLocal): string {
    const datos = Buffer.from(JSON.stringify(permiso)).toString('base64url');
    return `${datos}.${this.hmac(datos)}`;
  }

  private hmac(datos: string): string {
    return createHmac('sha256', this.secreto)
      .update(`almacenamiento-local:${datos}`)
      .digest('base64url');
  }
}

function ahora(): number {
  return Math.floor(Date.now() / 1000);
}
