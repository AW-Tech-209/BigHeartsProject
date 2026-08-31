import { type Notification, NotificationType } from './notification.service';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** `Martes 12 de agosto de 2026, 6:00 p. m. (UTC)`. El servidor no conoce la zona del destinatario. */
function formatearFechaUTC(fecha: Date): string {
  const dia = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(fecha);

  const hora = new Intl.DateTimeFormat('es', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(fecha);

  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${hora} (UTC)`;
}

function html(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${p}</p>`).join('\n');
}

function text(paragraphs: string[]): string {
  return paragraphs.join('\n\n');
}

export function buildEmail(notification: Notification): EmailContent {
  const { type, recipient, classroom } = notification;
  const nombre = recipient.firstName;
  const aula = classroom?.title ?? 'tu clase';
  const cuando = classroom ? formatearFechaUTC(classroom.scheduledAt) : 'la hora que reservaste';

  switch (type) {
    case NotificationType.TEACHER_APPROVED:
      return {
        subject: 'Tu cuenta de profesor fue aprobada',
        html: html([
          `Hola ${nombre},`,
          'Un administrador aprobó tu solicitud. Ya puedes entrar a la plataforma y publicar tus aulas.',
        ]),
        text: text([
          `Hola ${nombre},`,
          'Un administrador aprobó tu solicitud. Ya puedes entrar a la plataforma y publicar tus aulas.',
        ]),
      };

    case NotificationType.TEACHER_REJECTED:
      return {
        subject: 'Tu solicitud de profesor fue rechazada',
        html: html([
          `Hola ${nombre},`,
          'Un administrador rechazó tu solicitud para ser profesor en la plataforma.',
        ]),
        text: text([
          `Hola ${nombre},`,
          'Un administrador rechazó tu solicitud para ser profesor en la plataforma.',
        ]),
      };

    case NotificationType.BOOKING_CONFIRMED:
      return {
        subject: 'Tu reserva fue confirmada',
        html: html([
          `Hola ${nombre},`,
          `Tu reserva para «${aula}» quedó confirmada.`,
          `Fecha y hora: ${cuando}.`,
          'Entra a la plataforma antes de la clase para ver el enlace de la videollamada.',
        ]),
        text: text([
          `Hola ${nombre},`,
          `Tu reserva para «${aula}» quedó confirmada.`,
          `Fecha y hora: ${cuando}.`,
          'Entra a la plataforma antes de la clase para ver el enlace de la videollamada.',
        ]),
      };

    case NotificationType.BOOKING_CANCELLED:
      return {
        subject: 'Tu reserva fue cancelada',
        html: html([
          `Hola ${nombre},`,
          `Tu reserva para «${aula}» (${cuando}) quedó cancelada. El cupo ya está disponible para otro estudiante.`,
        ]),
        text: text([
          `Hola ${nombre},`,
          `Tu reserva para «${aula}» (${cuando}) quedó cancelada. El cupo ya está disponible para otro estudiante.`,
        ]),
      };

    case NotificationType.CLASSROOM_CANCELLED:
      return {
        subject: 'La clase que reservaste fue cancelada',
        html: html([
          `Hola ${nombre},`,
          `El profesor canceló «${aula}», programada para ${cuando}. Tu cupo quedó liberado.`,
          'Puedes reservar otra aula disponible cuando quieras.',
        ]),
        text: text([
          `Hola ${nombre},`,
          `El profesor canceló «${aula}», programada para ${cuando}. Tu cupo quedó liberado.`,
          'Puedes reservar otra aula disponible cuando quieras.',
        ]),
      };
  }
}
