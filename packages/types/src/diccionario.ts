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

// ── Gestión (solo ADMIN) ──────────────────────────────────────────────────────

/** Estado de la seña para el admin. Prioridad: lista > procesando > error > sin-sena. */
export type EstadoSenaAdmin = 'lista' | 'procesando' | 'error' | 'sin-sena';

export const ESTADOS_SENA_ADMIN: readonly EstadoSenaAdmin[] = [
  'lista',
  'procesando',
  'error',
  'sin-sena',
];

export const ESTADO_SENA_ADMIN_LABELS: Record<EstadoSenaAdmin, string> = {
  lista: 'Lista',
  procesando: 'Procesando',
  error: 'Error',
  'sin-sena': 'Sin seña',
};

/** `GET /admin/diccionario/avance` */
export interface AvanceModulo extends ModuloRef {
  palabras: number;
  conSena: number;
  procesando: number;
  conError: number;
  sinSena: number;
}

export interface AvanceDiccionarioResponse {
  modulos: AvanceModulo[];
  totales: { sinSena: number; enPapelera: number };
}

export const ENTRADAS_ADMIN_PAGE_SIZE_DEFAULT = 25;
export const ENTRADAS_ADMIN_PAGE_SIZE_MAX = 100;

/** `GET /admin/diccionario/entradas`. Nunca trae las de la papelera. */
export interface EntradasAdminQuery {
  q?: string;
  /** Número del módulo (1–9). */
  modulo?: number;
  /** Slug de la categoría. */
  categoria?: string;
  tipo?: TipoEntrada;
  /** Código de la unidad («U1»). */
  unidad?: string;
  sena?: EstadoSenaAdmin;
  imagen?: 'con' | 'sin';
  publicada?: boolean;
  page?: number;
  pageSize?: number;
}

export interface EntradaAdmin {
  id: string;
  slug: string;
  ingles: string;
  espanol: string;
  tipo: TipoEntrada;
  nota: string | null;
  publicada: boolean;
  orden: number;
  modulo: ModuloRef & { id: string };
  unidad: (UnidadRef & { id: string }) | null;
  categoria: CategoriaRef & { id: string };
  sena: { estado: EstadoSenaAdmin };
  tieneImagen: boolean;
  updatedAt: string;
}

/** `conteosSena` cuenta con todos los filtros salvo `sena`: los chips suman `total` sin filtro de seña. */
export interface EntradasAdminResponse {
  items: EntradaAdmin[];
  total: number;
  page: number;
  pageSize: number;
  conteosSena: Record<EstadoSenaAdmin, number>;
}

/** `POST /admin/diccionario/entradas`. La unidad, si viene, debe ser del módulo. */
export interface CrearEntradaInput {
  ingles: string;
  espanol: string;
  tipo: TipoEntrada;
  moduloId: string;
  unidadId?: string | null;
  categoriaId: string;
  nota?: string | null;
  publicada?: boolean;
}

/** `PATCH /admin/diccionario/entradas/:id`. El slug no cambia aunque cambie el inglés. */
export type EditarEntradaInput = Partial<CrearEntradaInput>;

/** `GET /admin/diccionario/entradas/duplicados?ingles=&tipo=&excluir=`. Avisa, no bloquea. */
export interface DuplicadosQuery {
  ingles: string;
  tipo?: TipoEntrada;
  /** Id de la entrada que se edita, para no avisarse a sí misma. */
  excluir?: string;
}

export interface DuplicadoEntrada {
  id: string;
  slug: string;
  ingles: string;
  espanol: string;
  tipo: TipoEntrada;
  modulo: ModuloRef;
}

export interface DuplicadosResponse {
  duplicados: DuplicadoEntrada[];
}

export enum AccionLote {
  MOVER_CATEGORIA = 'mover-categoria',
  MOVER_MODULO = 'mover-modulo',
  OCULTAR = 'ocultar',
  PUBLICAR = 'publicar',
  ENVIAR_PAPELERA = 'enviar-papelera',
}

export const LOTE_MAX_IDS = 200;

/** `POST /admin/diccionario/entradas/lote`. Atómico: si una falla, ninguna cambia. */
export interface LoteEntradasInput {
  ids: string[];
  accion: AccionLote;
  /** Obligatorio con `mover-categoria`. */
  categoriaId?: string;
  /** Obligatorio con `mover-modulo`. */
  moduloId?: string;
  /** Opcional con `mover-modulo`; sin ella, las entradas quedan sin unidad. */
  unidadId?: string | null;
}

export interface LoteEntradasResponse {
  actualizadas: number;
}

// ── Medios: señas e imágenes (solo ADMIN, D51) ────────────────────────────────

export const VIDEO_TIPOS_PERMITIDOS = ['video/mp4'] as const;
export const MINIATURA_TIPOS_PERMITIDOS = ['image/jpeg'] as const;
export const IMAGEN_TIPOS_PERMITIDOS = ['image/webp', 'image/jpeg'] as const;
export type TipoImagen = (typeof IMAGEN_TIPOS_PERMITIDOS)[number];

/** El navegador sube el archivo DIRECTO al almacenamiento con esta petición firmada. */
export interface UrlDeSubida {
  url: string;
  metodo: 'PUT';
  headers: Record<string, string>;
}

/** `POST /admin/diccionario/entradas/:id/video/subida` */
export interface SubidaVideoInput {
  tipo: 'video/mp4';
  bytes: number;
  duracionMs: number;
  miniaturaTipo: 'image/jpeg';
}

export interface SubidaVideoResponse {
  videoId: string;
  video: UrlDeSubida;
  miniatura: UrlDeSubida;
}

/** `POST …/video/:videoId/confirmar`: la seña queda `lista`. */
export interface ConfirmarVideoResponse {
  videoId: string;
  estado: EstadoSenaAdmin;
}

/** `POST /admin/diccionario/entradas/:id/imagen/subida` */
export interface SubidaImagenInput {
  tipo: TipoImagen;
  bytes: number;
}

/** `clave` se devuelve tal cual en `POST …/imagen/confirmar`. */
export interface SubidaImagenResponse {
  clave: string;
  imagen: UrlDeSubida;
}

export interface ConfirmarImagenInput {
  clave: string;
}

/** `GET /admin/diccionario/sin-sena?modulo=`: lo que aún no tiene seña lista (Cola de grabación). */
export interface SinSenaQuery {
  modulo?: number;
}

export interface EntradaSinSena {
  id: string;
  slug: string;
  ingles: string;
  inglesNorm: string;
  modulo: ModuloRef;
  unidad: UnidadRef | null;
  categoria: CategoriaRef;
  sena: { estado: Exclude<EstadoSenaAdmin, 'lista'> };
}

export interface SinSenaResponse {
  entradas: EntradaSinSena[];
}
