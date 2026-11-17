import type { EntradaSinSena } from '@academia/types';

const celda = (valor: string) =>
  /[",\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;

/** Mismo formato que `sin-sena.csv` del servidor: el nombre de archivo es el slug. */
export function csvSinSena(entradas: EntradaSinSena[]): string {
  const filas = entradas.map((e) =>
    [String(e.modulo.numero), e.unidad?.codigo ?? '', e.ingles, nombreDeArchivo(e)]
      .map(celda)
      .join(','),
  );
  return ['modulo,unidad,ingles,nombre_de_archivo', ...filas].join('\r\n') + '\r\n';
}

export function nombreDeArchivo(entrada: { slug: string }): string {
  return `${entrada.slug}.mp4`;
}
