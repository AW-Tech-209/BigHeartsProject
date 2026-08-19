import { CircleCheck, CircleSlash, type LucideIcon } from 'lucide-react';

/** Los dos desenlaces que un administrador puede dar a una solicitud. */
export type TeacherResolution = 'approve' | 'reject';

/**
 * Todo el texto y la forma visual de una resolución, en un solo sitio.
 *
 * Vive aquí y no repartido por el JSX por la regla de microcopy que más se
 * incumple sola: **el mismo verbo en todo el flujo**. El botón de la fila dice
 * «Aprobar», el del diálogo dice «Aprobar profesor» y el anuncio dice
 * «Aprobaste a…» — tres textos que tienen que moverse juntos. Separados en el
 * componente, el día que alguien cambie uno los otros dos se quedan atrás y el
 * usuario que lee español como segunda lengua paga la incoherencia.
 *
 * `announcement` es lo que se manda a la región viva: el lector de pantalla no
 * ve que la fila desapareció de la tabla, así que hay que contárselo.
 */
export type ResolutionCopy = {
  /** Verbo del botón de la fila. Una palabra. */
  trigger: string;
  /** Título del diálogo. **Nombra a la persona**, no pregunta «¿Estás seguro?». */
  dialogTitle: (fullName: string) => string;
  /** La consecuencia, en una frase. Es lo que el administrador necesita saber. */
  dialogDescription: string;
  /** Botón que confirma. Lleva verbo, nunca «Sí». */
  confirm: string;
  /** Qué se lee mientras el servidor responde. Nunca un spinner mudo. */
  pending: string;
  /** Lo que se anuncia por `aria-live` cuando el servidor confirma. */
  announcement: (fullName: string) => string;
  variant: 'default' | 'destructive';
  icon: LucideIcon;
};

/**
 * Aprobar es la acción esperada; rechazar es la que se puede lamentar.
 *
 * Por eso solo `reject` es `destructive`: el color no decora, significa
 * pérdida. Y por eso su descripción dice explícitamente que el profesor no
 * podrá entrar — un rechazo no se deshace desde esta pantalla, y esconder eso
 * detrás de un «¿Confirmar?» es cómo se toman decisiones que luego se
 * reclaman.
 */
export const resolutionCopy: Record<TeacherResolution, ResolutionCopy> = {
  approve: {
    trigger: 'Aprobar',
    dialogTitle: (fullName) => `¿Aprobar a ${fullName}?`,
    dialogDescription:
      'Podrá iniciar sesión en la plataforma y crear aulas. Le avisaremos por correo.',
    confirm: 'Aprobar profesor',
    pending: 'Aprobando al profesor…',
    announcement: (fullName) => `Aprobaste a ${fullName}. Ya puede iniciar sesión.`,
    variant: 'default',
    icon: CircleCheck,
  },
  reject: {
    trigger: 'Rechazar',
    dialogTitle: (fullName) => `¿Rechazar la solicitud de ${fullName}?`,
    dialogDescription:
      'No podrá entrar a la plataforma. Desde esta pantalla no se puede deshacer. Le avisaremos por correo.',
    confirm: 'Rechazar profesor',
    pending: 'Rechazando al profesor…',
    announcement: (fullName) => `Rechazaste la solicitud de ${fullName}.`,
    variant: 'destructive',
    icon: CircleSlash,
  },
};

/** Nombre y apellido, como se nombra a una persona en pantalla. */
export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`;
}

/**
 * La fecha en que alguien pidió su cuenta, escrita entera.
 *
 * Completa y explícita, nunca `12/08`: el microcopy lo exige y además `12/08`
 * es ambiguo entre convenciones. Sin hora, a propósito — para decidir sobre una
 * solicitud importa el día que lleva esperando, no el minuto en que pulsó
 * «Crear cuenta».
 *
 * Se formatea en la zona del navegador, que es donde está el administrador que
 * lo lee. El servidor guarda y compara siempre en UTC (§4.7); esto es solo
 * presentación.
 */
export function formatRequestDate(isoDate: string): string {
  const date = new Date(isoDate);

  // Una fecha inválida se imprimiría como «Invalid Date» en medio de la tabla.
  // Preferimos una celda honesta a un texto que parece un dato.
  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
