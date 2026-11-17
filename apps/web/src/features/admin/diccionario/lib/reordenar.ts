/** Mueve `id` una posición arriba (-1) o abajo (+1). En los extremos devuelve `null`: no hay cambio. */
export function moverEnLista(ids: readonly string[], id: string, paso: -1 | 1): string[] | null {
  const desde = ids.indexOf(id);
  const hasta = desde + paso;
  if (desde === -1 || hasta < 0 || hasta >= ids.length) return null;
  const nuevos = [...ids];
  nuevos.splice(desde, 1);
  nuevos.splice(hasta, 0, id);
  return nuevos;
}

/** El código que el servidor pondrá a la próxima unidad: el mayor número + 1. */
export function siguienteCodigoUnidad(codigos: readonly string[]): string {
  const numeros = codigos.map((c) => Number(c.replace(/^U/, ''))).filter(Number.isFinite);
  return `U${Math.max(0, ...numeros) + 1}`;
}
