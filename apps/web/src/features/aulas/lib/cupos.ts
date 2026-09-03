/** `1` → «1 cupo`; cualquier otro → «N cupos». */
export function pluralizarCupos(n: number): string {
  return `${n} ${n === 1 ? 'cupo' : 'cupos'}`;
}
