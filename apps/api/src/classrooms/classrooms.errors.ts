import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiErrorCode,
  type ClassroomDurationInvalidDetails,
  type ClassroomLeadTimeWarningDetails,
  type TeacherScheduleConflictDetails,
  UserStatus,
} from '@academia/types';

import {
  accountPending,
  accountRejected,
  accountSuspended,
  insufficientRole,
} from '../auth/auth.errors';

/**
 * Fábricas de las excepciones de dominio de aulas.
 *
 * **El estado de la cuenta no añadió ningún código nuevo al catálogo
 * (HU-201).** Los estados de cuenta ya
 * tienen los suyos —`ACCOUNT_PENDING`, `ACCOUNT_REJECTED`,
 * `ACCOUNT_SUSPENDED`—, dicen exactamente lo que bloquea, y el frontend ya sabe
 * distinguirlos desde el login. Inventar un `TEACHER_NOT_ACTIVE` habría
 * duplicado esa distinción en dos vocabularios que luego hay que mantener
 * sincronizados. Ver `contrato-api.md` §3: los códigos se añaden cuando dicen
 * algo que ninguno decía, no cuando cambia el endpoint que los emite.
 *
 * Las tres de coherencia temporal (HU-212) sí lo cumplen: ninguna se podía
 * decir con lo que había. Además **llevan `details`**, porque los dos umbrales
 * salen del entorno y el formulario no puede saberlos de antemano; el filtro
 * global los reenvía tal cual al cliente.
 */

/**
 * El profesor del token ya no existe en la BD.
 *
 * Misma carrera que en `/users/me`: el access token vive 15 minutos y se
 * verifica solo por firma, así que sobrevive a que se borre la cuenta.
 */
export const teacherProfileNotFound = (): NotFoundException =>
  new NotFoundException({
    code: ApiErrorCode.USER_NOT_FOUND,
    message: 'No encontramos tu perfil. Inicia sesión de nuevo.',
  });

/**
 * No hay ningún aula con ese identificador (HU-204, A3).
 *
 * Lo emite tanto un uuid que no existe como uno con forma inválida —el
 * `ParseUUIDPipe` del controlador lo traduce aquí—: desde fuera los dos son el
 * mismo hecho, «ahí no hay nada», y separarlos solo le confirmaría a quien
 * sondea que acertó con el formato. Mismo criterio que `teacherNotFound()` en
 * `admin/`.
 *
 * **Un aula `CANCELLED` no pasa por aquí.** Existe, se abre y muestra su estado:
 * quien tenga el enlace de la página tiene que poder entender qué pasó, y un 404
 * ahí se lee como un fallo de la plataforma.
 */
export const classroomNotFound = (): NotFoundException =>
  new NotFoundException({
    code: ApiErrorCode.CLASSROOM_NOT_FOUND,
    message: 'No encontramos esta clase. Puede que ya no esté disponible.',
  });

/**
 * Quien pide `PATCH /classrooms/:id` no es el profesor dueño del aula
 * (HU-211).
 *
 * Es 403 y no 404: el aula existe y quien pregunta ya la vio en el catálogo
 * para saber su id, lo que falta es el permiso, no el dato — mismo criterio
 * que separa `CLASSROOM_NOT_FOUND` de un intento de acceso indebido.
 */
export const classroomForbidden = (): ForbiddenException =>
  new ForbiddenException({
    code: ApiErrorCode.CLASSROOM_FORBIDDEN,
    message: 'Esta aula no es tuya.',
  });

/**
 * El aula que se quiere publicar se solapa con otra `PUBLISHED` del mismo
 * profesor (HU-212, AC1). Nadie está en dos videollamadas a la vez.
 *
 * Es 409 y no 400: el cuerpo está perfectamente formado, lo que pasa es que ese
 * horario ya está ocupado. Y **bloquea sin confirmación posible**, al revés que
 * {@link classroomLeadTimeWarning}: la poca antelación es una molestia que el
 * profesor se causa a sí mismo, esto es un imposible físico.
 *
 * **El `details` lleva el aula con la que se choca, y eso es el AC5 entero**: un
 * error que solo dijera «hay un conflicto de horario» obliga al profesor a
 * buscar a mano cuál de sus clases es. Con esto el mensaje puede nombrarla.
 * `meetingLink` no viaja aquí aunque el aula sea suya (§4.8, regla 2).
 */
export const teacherScheduleConflict = (
  details: TeacherScheduleConflictDetails,
): ConflictException =>
  new ConflictException({
    code: ApiErrorCode.TEACHER_SCHEDULE_CONFLICT,
    message: `Ya tienes «${details.conflictoTitulo}» en ese horario.`,
    details,
  });

/**
 * `durationMinutes` supera `CLASS_MAX_DURATION_MINUTES` (HU-212, AC6).
 *
 * Es 400 —el valor enviado no es aceptable— pero **no un `VALIDATION_ERROR`**:
 * el tope sale del entorno, así que el DTO no puede declararlo con un `@Max` y
 * el formulario necesita que la respuesta le diga cuál era el máximo real. Por
 * eso `maximoMinutos` viaja en `details` en vez de quedarse solo dentro del
 * mensaje, que el frontend no parsea nunca (`contrato-api.md` §3).
 */
export const classroomDurationInvalid = (maximoMinutos: number): BadRequestException => {
  const details: ClassroomDurationInvalidDetails = { maximoMinutos };

  return new BadRequestException({
    code: ApiErrorCode.CLASSROOM_DURATION_INVALID,
    message: `Una clase no puede durar más de ${maximoMinutos} minutos.`,
    details,
  });
};

/**
 * El aula empieza antes de `CLASS_MIN_LEAD_MINUTES` (HU-212, AC7).
 *
 * **Es un aviso, no un rechazo**, y esta es la única excepción del repo que se
 * lanza esperando que la vuelvan a intentar: la misma petición con
 * `confirmarPocaAntelacion: true` se acepta. Se emite como 409 porque el cuerpo
 * es válido y lo que falta es una decisión del profesor sobre un conflicto con
 * el reloj — no hay nada que corregir en el formulario.
 *
 * Van los dos números en `details` porque el diálogo tiene que explicar la
 * consecuencia, y para explicarla necesita decir cuánta antelación falta: por
 * debajo de la ventana de acceso (§4.1) el enlace se revela en el mismo instante
 * en que se publica la clase, y el recordatorio de 24 h (§4.6) no llega nunca.
 */
export const classroomLeadTimeWarning = (
  minutosDeAntelacion: number,
  minimoMinutos: number,
): ConflictException => {
  const details: ClassroomLeadTimeWarningDetails = { minutosDeAntelacion, minimoMinutos };

  return new ConflictException({
    code: ApiErrorCode.CLASSROOM_LEAD_TIME_WARNING,
    message: `Esta clase empieza en menos de ${minimoMinutos} minutos.`,
    details,
  });
};

/**
 * Traduce el estado de la cuenta del profesor al 403 que le corresponde.
 *
 * Los tres mensajes son distintos porque los tres hechos son distintos, y el
 * microcopy de este producto es deliberadamente literal (D13): a un profesor
 * cuya solicitud fue rechazada no se le puede decir que su cuenta "está
 * suspendida", ni a uno que espera aprobación que "no tiene permiso".
 *
 * `ACTIVE` no aparece: quien llega aquí ya falló la comprobación. Si algún día
 * se añade un estado nuevo a `UserStatus`, esto lo bloquea por defecto en vez
 * de dejarlo pasar — que es la respuesta segura ante un estado desconocido.
 */
export const teacherNotActive = (status: UserStatus): ForbiddenException => {
  switch (status) {
    case UserStatus.PENDING:
      return accountPending();
    case UserStatus.REJECTED:
      return accountRejected();
    case UserStatus.SUSPENDED:
      return accountSuspended();
    default:
      return insufficientRole();
  }
};
