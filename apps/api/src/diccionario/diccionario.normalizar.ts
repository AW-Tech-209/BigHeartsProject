import { normalizarTexto, TipoEntrada } from '@academia/types';

export { normalizarTexto };

/** Slug legible desde el inglés: «To eat» → `to-eat`. */
export function slugBase(ingles: string): string {
  return (
    normalizarTexto(ingles)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'entrada'
  );
}

/** Primer slug libre: `to-eat`, `to-eat-2`, `to-eat-3`… */
export function slugUnico(base: string, ocupados: ReadonlySet<string>): string {
  if (!ocupados.has(base)) return base;
  let n = 2;
  while (ocupados.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

const TIPOS_POR_ETIQUETA: Record<string, TipoEntrada> = {
  palabra: TipoEntrada.PALABRA,
  verbo: TipoEntrada.VERBO,
  frase: TipoEntrada.FRASE,
  expresion: TipoEntrada.EXPRESION,
};

/** «Expresión» → `EXPRESION`; `null` si no es un tipo conocido. */
export function tipoDesdeEtiqueta(etiqueta: string): TipoEntrada | null {
  return TIPOS_POR_ETIQUETA[normalizarTexto(etiqueta)] ?? null;
}

/** CSV con comillas dobles (RFC 4180): devuelve filas de celdas, sin la cabecera. */
export function parsearCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        celda += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === ',') {
      fila.push(celda);
      celda = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = '';
    } else {
      celda += c;
    }
  }
  if (celda !== '' || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }

  return filas.filter((f) => f.some((c) => c.trim() !== '')).slice(1);
}
