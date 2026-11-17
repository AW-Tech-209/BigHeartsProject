import { normalizarTexto } from '@academia/types';

export type EntradaEmparejable = {
  id: string;
  slug: string;
  ingles: string;
  modulo: { numero: number };
  /** `true` si ya tiene una seña lista: subir otra la reemplaza. */
  conSena: boolean;
};

export type Emparejamiento<E extends EntradaEmparejable = EntradaEmparejable> =
  | { estado: 'emparejada'; entrada: E }
  | { estado: 'reemplaza'; entrada: E }
  | { estado: 'ambigua'; candidatas: E[] }
  | { estado: 'sin-emparejar'; sugerencia: E | null };

const MAX_DISTANCIA_SUGERENCIA = 2;

/** `To_Eat.MP4` y «To eat» dan la misma clave: sin extensión, tildes ni signos; `-`/`_`/espacio iguales. */
export function claveDeNombre(texto: string): string {
  return normalizarTexto(texto.replace(/\.[a-z0-9]{2,4}$/i, '').replace(/[-_]+/g, ' '))
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0] ?? 0;
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j] ?? 0;
      fila[j] = Math.min(
        arriba + 1,
        (fila[j - 1] ?? 0) + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = arriba;
    }
  }
  return fila[b.length] ?? 0;
}

/**
 * Empareja cada archivo por el inglés normalizado. Si no coincide, prueba el slug: la lista
 * descargada nombra `house-2.mp4` al segundo «House» para que no quede ambiguo.
 */
export function emparejarArchivos<E extends EntradaEmparejable>(
  nombres: string[],
  entradas: E[],
): Emparejamiento<E>[] {
  const porSlug = new Map(entradas.map((e) => [e.slug, e]));
  const porClave = new Map<string, E[]>();
  for (const e of entradas) {
    const clave = claveDeNombre(e.ingles);
    porClave.set(clave, [...(porClave.get(clave) ?? []), e]);
  }

  return nombres.map((nombre): Emparejamiento<E> => {
    const clave = claveDeNombre(nombre);
    const porIngles = porClave.get(clave) ?? [];
    if (porIngles.length > 1) return { estado: 'ambigua', candidatas: porIngles };
    const primera = porIngles[0] ?? porSlug.get(clave.replace(/ /g, '-'));
    if (primera) return { estado: primera.conSena ? 'reemplaza' : 'emparejada', entrada: primera };

    let mejor: E | null = null;
    let mejorDistancia = Infinity;
    let empate = false;
    for (const [otra, grupo] of porClave) {
      const d = distancia(clave, otra);
      if (d < mejorDistancia) {
        mejorDistancia = d;
        mejor = grupo.length === 1 ? (grupo[0] ?? null) : null;
        empate = false;
      } else if (d === mejorDistancia) {
        empate = true;
      }
    }
    const sugerencia = mejorDistancia <= MAX_DISTANCIA_SUGERENCIA && !empate ? mejor : null;
    return { estado: 'sin-emparejar', sugerencia };
  });
}
