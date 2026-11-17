import { normalizarTexto } from '@academia/types';

export type Segmento = { texto: string; coincide: boolean };

/** Parte `texto` alrededor de la primera coincidencia de `busqueda`, sin distinguir tildes ni mayúsculas. */
export function resaltar(texto: string, busqueda: string): Segmento[] {
  const q = normalizarTexto(busqueda);
  if (!q) return [{ texto, coincide: false }];

  // Normaliza carácter a carácter para poder volver a las posiciones del original.
  let plano = '';
  const origen: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    const c = texto
      .charAt(i)
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    for (const letra of c) {
      plano += letra;
      origen.push(i);
    }
  }

  const desde = plano.indexOf(q);
  if (desde === -1) return [{ texto, coincide: false }];
  const inicio = origen[desde] ?? 0;
  const fin = (origen[desde + q.length - 1] ?? texto.length - 1) + 1;

  return [
    { texto: texto.slice(0, inicio), coincide: false },
    { texto: texto.slice(inicio, fin), coincide: true },
    { texto: texto.slice(fin), coincide: false },
  ].filter((s) => s.texto !== '');
}
