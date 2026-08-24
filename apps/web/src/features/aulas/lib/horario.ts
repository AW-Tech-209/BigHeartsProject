/**
 * Fecha y hora de una clase: de lo que el profesor teclea a lo que viaja por la
 * red, y de vuelta al texto que lee.
 *
 * Toda esta pieza existe por una regla: `scheduledAt` es un **instante**, no
 * una fecha con hora suelta (`docs/ARQUITECTURA.md` §4.7). El formulario
 * recoge dos campos separados —día y hora— en la zona del profesor, y lo que
 * sale de aquí es un ISO 8601 en UTC. La comparación temporal la hace el
 * servidor; esto es solo traducción.
 */

/** Fecha (`aaaa-mm-dd`) y hora (`hh:mm`) tal y como las devuelven los inputs nativos. */
export type FechaYHora = { fecha: string; hora: string };

/**
 * Combina el día y la hora que eligió el profesor —interpretados en **su** zona
 * horaria, que es la que tenía en la cabeza al escribirlos— y devuelve el
 * instante en ISO 8601 UTC.
 *
 * Devuelve `null` si los campos no forman una fecha real. El 31 de febrero es
 * el caso que importa: `new Date(2099, 1, 31)` no falla, **desborda al 3 de
 * marzo**, así que sin la comprobación de vuelta el profesor publicaría su
 * clase en un día que no eligió y la API respondería 201.
 */
export function aInstanteISO({ fecha, hora }: FechaYHora): string | null {
  const partesFecha = fecha.split('-').map(Number);
  const partesHora = hora.split(':').map(Number);

  if (partesFecha.length !== 3 || partesHora.length < 2) {
    return null;
  }

  const [anio, mes, dia] = partesFecha as [number, number, number];
  const [horas, minutos] = partesHora as [number, number];

  if ([anio, mes, dia, horas, minutos].some((parte) => Number.isNaN(parte))) {
    return null;
  }

  const instante = new Date(anio, mes - 1, dia, horas, minutos, 0, 0);

  const sobrevivio =
    instante.getFullYear() === anio &&
    instante.getMonth() === mes - 1 &&
    instante.getDate() === dia &&
    instante.getHours() === horas &&
    instante.getMinutes() === minutos;

  return sobrevivio ? instante.toISOString() : null;
}

/**
 * El texto completo con el que se le confirma al profesor qué acaba de elegir:
 * `Martes 12 de agosto de 2026, 6:00 p. m. (hora de Colombia)`.
 *
 * **La zona se nombra siempre.** Es la exigencia del microcopy y no es
 * decorativa: la promesa del producto es que el estudiante llega a su clase, y
 * una hora sin zona es la forma más barata de que llegue una hora tarde. Por lo
 * mismo el día de la semana va delante — `12/08` obliga a ir a un calendario a
 * comprobar si cae entre semana.
 *
 * El año se incluye a propósito aunque casi siempre sea el actual: una clase
 * creada por error para el año que viene se detecta leyendo esta línea, que es
 * justo para lo que está.
 */
export function describirHorario(instanteISO: string): string {
  const instante = new Date(instanteISO);

  if (Number.isNaN(instante.getTime())) {
    return 'Fecha no disponible';
  }

  const fecha = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(instante);

  return `${enMayuscula(fecha)}, ${formatearHora(instante)} (${nombreDeZona(instante)})`;
}

/**
 * El intervalo que ocupa una clase, en minúscula y listo para ir **dentro de
 * una frase**: `martes 25 de agosto, de 6:00 p. m. a 7:00 p. m. (hora de
 * Colombia)`.
 *
 * Existe para el error de solapamiento de HU-212 (AC5). No basta con decir
 * cuándo EMPIEZA el aula con la que se choca: quien está buscando un hueco
 * necesita saber cuándo queda libre, y con solo el inicio tendría que ir a
 * mirar la duración a otra pantalla. El año no va —el choque siempre es con una
 * clase futura y cercana— pero la zona sí, por lo mismo que en
 * {@link describirHorario}.
 */
export function describirRangoHorario(instanteISO: string, durationMinutes: number): string {
  const inicio = new Date(instanteISO);

  if (Number.isNaN(inicio.getTime())) {
    return 'Fecha no disponible';
  }

  const fin = new Date(inicio.getTime() + durationMinutes * 60_000);

  const fecha = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(inicio);

  return `${fecha}, de ${formatearHora(inicio)} a ${formatearHora(fin)} (${nombreDeZona(inicio)})`;
}

/**
 * `6:00 p. m.`
 *
 * `hour12` explícito: el locale `es` formatea en 24 horas por defecto, y el
 * microcopy de este producto usa la forma en que la gente dice la hora en voz
 * alta, que es la que menos hay que traducir mentalmente.
 */
function formatearHora(instante: Date): string {
  return new Intl.DateTimeFormat('es', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(instante);
}

/**
 * El nombre largo de la zona del navegador: `hora de Colombia`, `hora de verano
 * de Europa central`.
 *
 * Se saca del formateador y no de una tabla propia porque `Intl` ya sabe si esa
 * fecha cae en horario de verano — y una tabla nuestra estaría mintiendo dos
 * veces al año en media Europa.
 */
function nombreDeZona(instante: Date): string {
  const partes = new Intl.DateTimeFormat('es', {
    hour: 'numeric',
    timeZoneName: 'long',
  }).formatToParts(instante);

  return partes.find((parte) => parte.type === 'timeZoneName')?.value ?? 'tu zona horaria';
}

/** `martes 12 de agosto` → `Martes 12 de agosto`. */
function enMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Duración legible: `1 hora 30 minutos`.
 *
 * En palabras y no en `90 min`: quien lee español como segunda lengua no debería
 * tener que hacer la división mental para saber si una clase le cabe en la tarde.
 */
export function describirDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  const partes: string[] = [];
  if (horas > 0) partes.push(horas === 1 ? '1 hora' : `${horas} horas`);
  if (resto > 0) partes.push(resto === 1 ? '1 minuto' : `${resto} minutos`);

  return partes.join(' ') || '0 minutos';
}
