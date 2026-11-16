/** Tramo del módulo. Coincide con `TramoModulo` de `schema.prisma`. */
export enum TramoModulo {
  BASICO = 'BASICO',
  INTERMEDIO = 'INTERMEDIO',
  AVANZADO = 'AVANZADO',
}

export const TRAMO_MODULO_LABELS: Record<TramoModulo, string> = {
  [TramoModulo.BASICO]: 'Básico',
  [TramoModulo.INTERMEDIO]: 'Intermedio',
  [TramoModulo.AVANZADO]: 'Avanzado',
};

export enum EstadoModulo {
  DISPONIBLE = 'DISPONIBLE',
  PROXIMAMENTE = 'PROXIMAMENTE',
}

export const ESTADO_MODULO_LABELS: Record<EstadoModulo, string> = {
  [EstadoModulo.DISPONIBLE]: 'Disponible',
  [EstadoModulo.PROXIMAMENTE]: 'Próximamente',
};

export enum TipoEntrada {
  PALABRA = 'PALABRA',
  VERBO = 'VERBO',
  FRASE = 'FRASE',
  EXPRESION = 'EXPRESION',
}

export const TIPO_ENTRADA_LABELS: Record<TipoEntrada, string> = {
  [TipoEntrada.PALABRA]: 'Palabra',
  [TipoEntrada.VERBO]: 'Verbo',
  [TipoEntrada.FRASE]: 'Frase',
  [TipoEntrada.EXPRESION]: 'Expresión',
};

export enum LenguaSenas {
  LSC = 'LSC',
}

export const LENGUA_SENAS_LABELS: Record<LenguaSenas, string> = {
  [LenguaSenas.LSC]: 'Lengua de Señas Colombiana',
};

export enum EstadoVideo {
  SUBIENDO = 'SUBIENDO',
  PROCESANDO = 'PROCESANDO',
  LISTO = 'LISTO',
  ERROR = 'ERROR',
}

export const ESTADO_VIDEO_LABELS: Record<EstadoVideo, string> = {
  [EstadoVideo.SUBIENDO]: 'Subiendo',
  [EstadoVideo.PROCESANDO]: 'Procesando',
  [EstadoVideo.LISTO]: 'Lista',
  [EstadoVideo.ERROR]: 'Error',
};

/**
 * Forma de búsqueda: minúsculas, sin tildes (NFD), sin ¿?¡! y con espacios colapsados.
 * La misma función llena `inglesNorm`/`espanolNorm` y normaliza lo que se busca.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[¿?¡!]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Lectura (cualquier rol con sesión) ────────────────────────────────────────

/** Lo único que ve el estudiante de la seña: lista o en preparación. */
export type EstadoSena = 'lista' | 'en-preparacion';

/** `url` y `miniaturaUrl` son URLs firmadas de vida corta; `null` si no hay seña lista. */
export interface SenaEntrada {
  estado: EstadoSena;
  url: string | null;
  miniaturaUrl: string | null;
}

export interface ModuloRef {
  numero: number;
  nombre: string;
  tramo: TramoModulo;
}

export interface UnidadRef {
  codigo: string;
  nombre: string;
}

export interface CategoriaRef {
  slug: string;
  nombre: string;
  icono: string;
}

/** Un módulo en el inicio. `palabras` y `conSena` valen 0 si está `PROXIMAMENTE`. */
export interface ModuloResumen extends ModuloRef {
  estado: EstadoModulo;
  palabras: number;
  conSena: number;
}

/** `GET /diccionario` */
export interface DiccionarioInicioResponse {
  modulos: ModuloResumen[];
}

export interface UnidadConConteo extends UnidadRef {
  palabras: number;
}

export interface CategoriaConConteo extends CategoriaRef {
  descripcion: string | null;
  palabras: number;
}

/** `GET /diccionario/modulos/:numero?unidad=` */
export interface ModuloQuery {
  unidad?: string;
}

/**
 * `unidades` siempre trae todas las del módulo con su conteo total; `categorias`
 * solo las que tienen entradas (de la unidad elegida, si hay), de mayor a menor.
 */
export interface ModuloDetalleResponse {
  modulo: ModuloResumen;
  unidad: string | null;
  unidades: UnidadConConteo[];
  categorias: CategoriaConConteo[];
}

/** `GET /diccionario/modulos/:numero/categorias/:slug` */
export interface CategoriaQuery {
  tipo?: TipoEntrada;
  unidad?: string;
  conSena?: boolean;
}

export interface EntradaResumen {
  slug: string;
  ingles: string;
  espanol: string;
  tipo: TipoEntrada;
  unidad: UnidadRef | null;
  sena: SenaEntrada;
}

/** Conteos de la categoría completa, sin aplicar filtros: alimentan los chips. */
export interface FiltrosCategoria {
  tipos: Partial<Record<TipoEntrada, number>>;
  unidades: UnidadConConteo[];
  conSena: number;
  total: number;
}

/** Entradas ordenadas por unidad y luego por el orden del material del profe. */
export interface CategoriaDetalleResponse {
  modulo: ModuloRef;
  categoria: CategoriaRef & { descripcion: string | null };
  entradas: EntradaResumen[];
  filtros: FiltrosCategoria;
}

export interface EntradaVecina {
  slug: string;
  ingles: string;
  espanol: string;
}

/** `GET /diccionario/entradas/:slug`. Vecinas dentro de la misma categoría del mismo módulo. */
export interface EntradaDetalleResponse {
  slug: string;
  ingles: string;
  espanol: string;
  tipo: TipoEntrada;
  modulo: ModuloRef;
  unidad: UnidadRef | null;
  categoria: CategoriaRef;
  nota: string | null;
  imagenUrl: string | null;
  sena: SenaEntrada;
  posicion: { actual: number; total: number };
  anterior: EntradaVecina | null;
  siguiente: EntradaVecina | null;
}

export const BUSQUEDA_MIN_CARACTERES = 2;
export const BUSQUEDA_LIMITE_DEFAULT = 8;
export const BUSQUEDA_LIMITE_MAX = 50;

/** `GET /diccionario/buscar?q=&limite=` */
export interface BusquedaQuery {
  q: string;
  limite?: number;
}

export interface ResultadoBusqueda {
  slug: string;
  ingles: string;
  espanol: string;
  tipo: TipoEntrada;
  modulo: ModuloRef;
  categoria: CategoriaRef;
  sena: SenaEntrada;
}

/** Orden: exacto → prefijo → contiene → parecido. */
export interface BusquedaResponse {
  q: string;
  resultados: ResultadoBusqueda[];
}
