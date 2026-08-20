import type { EnglishLevel } from '@academia/types';

import { aInstanteISO } from './horario';

/**
 * Estado del formulario de aula.
 *
 * `fecha` y `hora` son dos campos separados —y no el `scheduledAt` del
 * contrato— porque son dos decisiones distintas para quien las teclea, y porque
 * los controles nativos de fecha y hora se manejan con el teclado sin aprender
 * nada. Se combinan en un instante al enviar.
 *
 * Los números son cadenas porque eso es lo que devuelve un `<select>`.
 */
export type ClassroomFormValues = {
  title: string;
  description: string;
  level: EnglishLevel;
  maxStudents: string;
  fecha: string;
  hora: string;
  durationMinutes: string;
  meetingLink: string;
};

/**
 * Campo → mensaje de error.
 *
 * Las claves son las del FORMULARIO, no las del contrato: `fecha` y `hora` son
 * dos campos en pantalla, así que el error tiene que poder señalar a uno de los
 * dos. `scheduledAt` es la clave que devuelve el backend, y se traduce a
 * `fecha` al recibirla — pintar ese error bajo un campo que el profesor no ve
 * lo dejaría sin saber qué corregir.
 */
export type ClassroomFieldErrors = Partial<Record<keyof ClassroomFormValues | 'form', string>>;

/**
 * Validación en cliente que refleja las reglas del `CreateClassroomDto`.
 *
 * Da respuesta inmediata sin ir a la red, pero **no es la autoridad**: el
 * servidor vuelve a validarlo todo, y su reloj es el que decide si una fecha es
 * futura (§4.7). Si las dos discrepan, gana el servidor y el formulario pinta
 * lo que él diga.
 */
export function validateClassroom(values: ClassroomFormValues): ClassroomFieldErrors {
  const errors: ClassroomFieldErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Ponle un nombre a la clase.';
  } else if (values.title.trim().length > 120) {
    errors.title = 'El nombre de la clase no puede superar los 120 caracteres.';
  }

  if (!values.description.trim()) {
    errors.description = 'Describe de qué trata la clase.';
  } else if (values.description.trim().length > 2000) {
    errors.description = 'La descripción no puede superar los 2000 caracteres.';
  }

  const maxStudents = Number(values.maxStudents);
  if (!values.maxStudents.trim()) {
    errors.maxStudents = 'Indica cuántos estudiantes caben en la clase.';
  } else if (!Number.isInteger(maxStudents) || maxStudents < 1) {
    errors.maxStudents = 'El cupo máximo debe ser al menos 1 estudiante.';
  }

  if (!values.fecha) {
    errors.fecha = 'Elige el día de la clase.';
  }

  if (!values.hora) {
    errors.hora = 'Elige la hora de inicio.';
  }

  if (values.fecha && values.hora) {
    const instante = aInstanteISO({ fecha: values.fecha, hora: values.hora });

    if (!instante) {
      errors.fecha = 'Esa fecha no existe. Revisa el día y el mes.';
    } else if (new Date(instante).getTime() <= Date.now()) {
      // El servidor comprueba esto otra vez contra su propio reloj. Aquí se
      // avisa antes para no gastarle un viaje al profesor.
      errors.fecha = 'La clase tiene que empezar en el futuro. Elige otra fecha u otra hora.';
    }
  }

  if (!values.meetingLink.trim()) {
    errors.meetingLink = 'Pega el enlace de la reunión que creaste en Zoom o Meet.';
  } else if (!esUrlDeReunion(values.meetingLink.trim())) {
    errors.meetingLink =
      'Pega el enlace completo, empezando por https:// (por ejemplo, https://meet.google.com/abc-defg-hij).';
  }

  return errors;
}

/**
 * ¿Es una URL http(s) con dominio?
 *
 * Se apoya en el parser del navegador en vez de en una expresión regular
 * propia, pero SÍ comprueba el protocolo a mano: `new URL('javascript:alert(1)')`
 * es una URL perfectamente válida, y no es un enlace de reunión.
 */
function esUrlDeReunion(valor: string): boolean {
  try {
    const url = new URL(valor);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}
