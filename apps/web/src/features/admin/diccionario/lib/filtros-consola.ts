import {
  ENTRADAS_ADMIN_PAGE_SIZE_DEFAULT,
  ESTADOS_SENA_ADMIN,
  type EntradasAdminQuery,
  type EstadoSenaAdmin,
  TipoEntrada,
} from '@academia/types';

const CODIGO_UNIDAD = /^U\d{1,2}$/;

/** Lee la URL de la consola; un valor que no se entiende se descarta en vez de romper la tabla. */
export function leerFiltrosConsola(params: URLSearchParams): EntradasAdminQuery {
  const filtros: EntradasAdminQuery = {};
  const q = params.get('q')?.trim();
  if (q) filtros.q = q;

  const modulo = Number(params.get('modulo'));
  if (Number.isInteger(modulo) && modulo >= 1 && modulo <= 9) filtros.modulo = modulo;

  const categoria = params.get('categoria')?.trim();
  if (categoria) filtros.categoria = categoria;

  const tipo = params.get('tipo')?.toUpperCase();
  if (tipo && Object.values<string>(TipoEntrada).includes(tipo)) filtros.tipo = tipo as TipoEntrada;

  const unidad = params.get('unidad')?.trim().toUpperCase();
  if (unidad && CODIGO_UNIDAD.test(unidad)) filtros.unidad = unidad;

  const sena = params.get('sena');
  if (sena && (ESTADOS_SENA_ADMIN as readonly string[]).includes(sena)) {
    filtros.sena = sena as EstadoSenaAdmin;
  }

  const imagen = params.get('imagen');
  if (imagen === 'con' || imagen === 'sin') filtros.imagen = imagen;

  const page = Number(params.get('page'));
  if (Number.isInteger(page) && page > 1) filtros.page = page;

  return filtros;
}

/** Cambiar cualquier filtro vuelve a la página 1; la unidad depende del módulo. */
export function cambiarFiltro(
  actual: EntradasAdminQuery,
  cambio: Partial<EntradasAdminQuery>,
): EntradasAdminQuery {
  const siguiente: EntradasAdminQuery = { ...actual, ...cambio };
  if (!('page' in cambio)) delete siguiente.page;
  if ('modulo' in cambio && cambio.modulo !== actual.modulo) delete siguiente.unidad;
  return siguiente;
}

export function aParamsConsola(filtros: EntradasAdminQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== '' && valor !== null) params.set(clave, String(valor));
  }
  return params;
}

export function hayFiltrosConsola(filtros: EntradasAdminQuery): boolean {
  return Object.keys(filtros).some((clave) => clave !== 'page');
}

export function totalPaginas(total: number, pageSize = ENTRADAS_ADMIN_PAGE_SIZE_DEFAULT): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
