import { type CategoriaQuery, TipoEntrada, type UnidadRef } from '@academia/types';

const CODIGO_UNIDAD = /^U\d{1,2}$/;

/** `?unidad=u1` → `U1`; cualquier otra cosa se ignora en vez de romper la pantalla. */
export function leerUnidad(params: URLSearchParams): string | undefined {
  const unidad = params.get('unidad')?.trim().toUpperCase();
  return unidad && CODIGO_UNIDAD.test(unidad) ? unidad : undefined;
}

export function leerFiltrosCategoria(params: URLSearchParams): CategoriaQuery {
  const tipo = params.get('tipo')?.toUpperCase();
  const filtros: CategoriaQuery = {};
  if (tipo && Object.values<string>(TipoEntrada).includes(tipo)) filtros.tipo = tipo as TipoEntrada;
  const unidad = leerUnidad(params);
  if (unidad) filtros.unidad = unidad;
  if (params.get('conSena') === 'true') filtros.conSena = true;
  return filtros;
}

/** Solo lo que filtra viaja en la URL: un enlace compartido abre la misma vista. */
export function aParams(filtros: CategoriaQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.unidad) params.set('unidad', filtros.unidad);
  if (filtros.conSena) params.set('conSena', 'true');
  return params;
}

export function hayFiltros(filtros: CategoriaQuery): boolean {
  return Boolean(filtros.tipo || filtros.unidad || filtros.conSena);
}

/** `U1` + «Need, Want» → «Unidad 1 · Need, Want». */
export function nombreUnidad(unidad: UnidadRef): string {
  const numero = unidad.codigo.replace(/^U/, '');
  return unidad.nombre ? `Unidad ${numero} · ${unidad.nombre}` : `Unidad ${numero}`;
}

export function etiquetaUnidadCorta(unidad: UnidadRef): string {
  return `Unidad ${unidad.codigo.replace(/^U/, '')}`;
}
