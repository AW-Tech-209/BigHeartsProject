import { ProblemaClase, type ValoracionAgregada } from '@academia/types';

/** Los problemas citados, de más a menos (los que nadie citó no se listan). */
export function problemasMasCitados(
  problemas: ValoracionAgregada['problemas'],
): { problema: ProblemaClase; veces: number }[] {
  return Object.values(ProblemaClase)
    .map((problema) => ({ problema, veces: problemas[problema] }))
    .filter(({ veces }) => veces > 0)
    .sort((a, b) => b.veces - a.veces);
}

/** «8 respuestas · 6 sí · 2 a medias» (sin ceros). */
export function describirRespuestas(valoracion: ValoracionAgregada): string {
  return [
    valoracion.respuestas === 1 ? '1 respuesta' : `${valoracion.respuestas} respuestas`,
    valoracion.si > 0 && `${valoracion.si} sí`,
    valoracion.aMedias > 0 && `${valoracion.aMedias} a medias`,
    valoracion.no > 0 && `${valoracion.no} no`,
  ]
    .filter(Boolean)
    .join(' · ');
}
