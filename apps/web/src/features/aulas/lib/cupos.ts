/** Concuerda verbo y sustantivo: «Queda 1 cupo» / «Quedan N cupos». */
export function describirCuposRestantes(n: number): string {
  return n === 1 ? 'Queda 1 cupo' : `Quedan ${n} cupos`;
}
