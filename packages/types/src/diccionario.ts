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
