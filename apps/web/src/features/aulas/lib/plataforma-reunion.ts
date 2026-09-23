import { ALLOWED_MEETING_PROVIDER_LABELS, MeetingProvider } from '@academia/types';

/**
 * A qué plataforma apunta el enlace. Desde HU-506 el servidor lo deriva del
 * propio enlace (D45); `MANUAL` y `DAILY` solo quedan en aulas anteriores y se
 * leen como «Otra».
 */
export const etiquetaPlataformaReunion: Record<MeetingProvider, string> = {
  [MeetingProvider.ZOOM]: ALLOWED_MEETING_PROVIDER_LABELS.ZOOM,
  [MeetingProvider.GOOGLE_MEET]: ALLOWED_MEETING_PROVIDER_LABELS.GOOGLE_MEET,
  [MeetingProvider.MICROSOFT_TEAMS]: ALLOWED_MEETING_PROVIDER_LABELS.MICROSOFT_TEAMS,
  [MeetingProvider.MANUAL]: 'Otra',
  [MeetingProvider.DAILY]: 'Otra',
};
