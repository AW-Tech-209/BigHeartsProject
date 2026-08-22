import { MeetingProvider } from '@academia/types';

/**
 * A qué plataforma apunta el enlace (HU-211, decisión 3). Solo las tres que
 * se ofrecen al crear o completar un aula — `DAILY` está reservado a Fase 1.5
 * y no aparece aquí.
 *
 * `MANUAL` se lee como «Otra»: el mecanismo (pegar el enlace a mano) no
 * cambia, lo que se declara es a qué plataforma apunta ese enlace.
 */
export const etiquetaPlataformaReunion: Record<MeetingProvider, string> = {
  [MeetingProvider.ZOOM]: 'Zoom',
  [MeetingProvider.GOOGLE_MEET]: 'Meet',
  [MeetingProvider.MANUAL]: 'Otra',
  [MeetingProvider.DAILY]: 'Otra',
};

/** Las opciones que se ofrecen en el selector — mismo orden en todo el producto. */
export const PLATAFORMAS_OFRECIDAS: MeetingProvider[] = [
  MeetingProvider.ZOOM,
  MeetingProvider.GOOGLE_MEET,
  MeetingProvider.MANUAL,
];
