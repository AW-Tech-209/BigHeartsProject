/**
 * Tipos de aviso que la plataforma sabe emitir.
 *
 * Se amplía a medida que las HUs los necesitan: hoy solo los dos de la
 * aprobación de profesores (HU-104). Los de reserva, cancelación y recordatorio
 * (`docs/ARQUITECTURA.md` §4.6) llegan con sus propias historias.
 */
export const NotificationType = {
  /** Un administrador aprobó la solicitud de un profesor: ya puede entrar. */
  TEACHER_APPROVED: 'TEACHER_APPROVED',
  /** Un administrador denegó la solicitud de un profesor. */
  TEACHER_REJECTED: 'TEACHER_REJECTED',
  /** Un estudiante reservó su cupo (HU-301, D29). */
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  /** Un estudiante canceló su reserva (HU-303, D29). */
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  /** El profesor canceló el aula: la reserva del estudiante también (HU-306, D29). */
  CLASSROOM_CANCELLED: 'CLASSROOM_CANCELLED',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/** A quién va el aviso. Lo mínimo que necesita cualquier plantilla. */
export interface NotificationRecipient {
  email: string;
  firstName: string;
}

/** Datos del aula que necesitan las plantillas de reserva y cancelación. */
export interface NotificationClassroom {
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
}

/** Un aviso a punto de salir: a quién, de qué tipo, con qué datos. */
export interface Notification {
  type: NotificationType;
  recipient: NotificationRecipient;
  /** Ausente en TEACHER_APPROVED/TEACHER_REJECTED: no hay aula involucrada. */
  classroom?: NotificationClassroom;
}

/** Qué pasó al intentar entregarlo. */
export interface NotificationResult {
  /** `true` solo si un proveedor real aceptó el mensaje. */
  delivered: boolean;
  /** Cómo se procesó: `log` en Fase 1, `email` cuando exista el adaptador real. */
  channel: 'log' | 'email';
}

/**
 * El PUERTO de notificaciones. Quien lo llama nunca sabe cómo se envía.
 *
 * Es una clase abstracta y no una `interface` de TypeScript por una razón
 * concreta: las interfaces se borran al compilar y no pueden ser token de
 * inyección. Con una clase abstracta, `constructor(private readonly
 * notifications: NotificationService)` funciona sin token de string y sin
 * `@Inject('NOTIFICATION_SERVICE')`, y el compilador sigue impidiendo llamar a
 * un método que el puerto no declara.
 *
 * **Decisión D14 (`docs/ARQUITECTURA.md` §4.6).** El adaptador real —proveedor,
 * plantillas, reintentos— es trabajo del **Sprint 4** y se enchufa cambiando
 * UNA línea del `NotificationsModule`, sin tocar a ningún llamador. Si estás
 * aquí para implementarlo: añade el adaptador nuevo, cambia el `useClass`, y no
 * toques esta firma ni a quien la invoca.
 *
 * **Nunca lanza.** Un fallo de notificación no puede deshacer una aprobación
 * que ya está escrita en la base de datos: el profesor quedaría `ACTIVE` con la
 * petición respondiendo error, y el administrador volvería a pulsar. El
 * resultado se devuelve, no se propaga.
 */
export abstract class NotificationService {
  abstract notify(notification: Notification): Promise<NotificationResult>;
}
