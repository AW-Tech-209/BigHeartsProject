import {
  ALLOWED_MEETING_PROVIDER_LABELS,
  BookingStatus,
  ClassroomSupport,
  InstructionMode,
  MeetingProvider,
} from '@academia/types';
import { Captions, LayoutGrid, Pin, Video, type LucideIcon } from 'lucide-react';

/*
  PENDIENTE: los nombres de los botones están escritos de memoria. Falta
  verificarlos a mano en la interfaz en español de Zoom, Meet y Teams y anotar
  aquí la fecha de verificación.
*/

/** Un texto o un nombre de botón de la plataforma (se pinta en `<strong>`). */
export type FragmentoPaso = string | { boton: string };

export type ClavePaso = 'subtitulos' | 'fijar-video' | 'vista' | 'camara';

export type PasoGuia = { clave: ClavePaso; icono: LucideIcon; partes: FragmentoPaso[] };

export type GuiaPlataforma = { titulo: string; pasos: PasoGuia[] };

/** Cómo se nombra a quien signa en la clase, sin inventar un modo que no se declaró. */
export function personaQueSigna(modo: InstructionMode | null | undefined): {
  de: string;
  a: string;
} {
  if (modo === InstructionMode.INTERPRETE_LSC) return { de: 'del intérprete', a: 'al intérprete' };
  if (modo === InstructionMode.LSC_NATIVA) return { de: 'del profesor', a: 'al profesor' };
  return { de: 'de la persona que signa', a: 'a la persona que signa' };
}

/** La guía es para quien tiene una reserva `CONFIRMED` en una clase que aún no terminó. */
export function debeMostrarGuia(
  estadoDeMiReserva: BookingStatus | null | undefined,
  claseTerminada: boolean,
): boolean {
  return estadoDeMiReserva === BookingStatus.CONFIRMED && !claseTerminada;
}

/** El ancla del bloque en el detalle: a donde apunta «Cómo ver bien al intérprete». */
export const ID_GUIA_ANTES_DE_ENTRAR = 'antes-de-entrar';

const ICONOS: Record<ClavePaso, LucideIcon> = {
  subtitulos: Captions,
  'fijar-video': Pin,
  vista: LayoutGrid,
  camara: Video,
};

type Textos = Record<ClavePaso, (persona: string) => FragmentoPaso[]>;

const ZOOM: Textos = {
  subtitulos: () => [
    'En la barra de abajo pulsa ',
    { boton: 'Subtítulos' },
    ' y elige ',
    { boton: 'Mostrar subtítulos' },
    '.',
  ],
  'fijar-video': (persona) => [
    `Pasa el cursor sobre el video ${persona}, pulsa los tres puntos y elige `,
    { boton: 'Fijar' },
    '.',
  ],
  vista: () => [
    'Arriba a la derecha pulsa ',
    { boton: 'Vista' },
    ' y elige ',
    { boton: 'Orador' },
    ' para que el video fijado ocupe la pantalla.',
  ],
  camara: () => [
    'Comprueba que tu cámara está encendida. Si en la barra de abajo ves ',
    { boton: 'Iniciar video' },
    ', pulsa ese botón.',
  ],
};

const MEET: Textos = {
  subtitulos: () => ['En la barra de abajo pulsa ', { boton: 'Activar subtítulos' }, '.'],
  'fijar-video': (persona) => [
    `Pasa el cursor sobre el video ${persona} y pulsa `,
    { boton: 'Fijar' },
    '.',
  ],
  vista: () => [
    'Pulsa ',
    { boton: 'Más opciones' },
    ', luego ',
    { boton: 'Cambiar diseño' },
    ' y elige ',
    { boton: 'Enfocado' },
    '.',
  ],
  camara: () => [
    'Antes de unirte, comprueba que la vista previa muestra tu cara. Si no, pulsa ',
    { boton: 'Activar cámara' },
    '.',
  ],
};

const TEAMS: Textos = {
  subtitulos: () => [
    'Pulsa ',
    { boton: 'Más' },
    ', luego ',
    { boton: 'Idioma y voz' },
    ' y elige ',
    { boton: 'Activar subtítulos en directo' },
    '.',
  ],
  'fijar-video': (persona) => [
    `Pasa el cursor sobre el video ${persona}, pulsa los tres puntos y elige `,
    { boton: 'Anclar' },
    '.',
  ],
  vista: () => [
    'Pulsa ',
    { boton: 'Vista' },
    ' y elige ',
    { boton: 'Galería' },
    '. El video anclado se queda en grande.',
  ],
  camara: () => [
    'Antes de unirte, comprueba que la vista previa muestra tu cara. Si no, activa el interruptor ',
    { boton: 'Cámara' },
    '.',
  ],
};

const GENERICA: Textos = {
  subtitulos: () => ['Busca la opción de subtítulos de tu plataforma y actívala.'],
  'fijar-video': (persona) => [
    `Busca la opción para fijar o anclar el video ${persona} y actívala.`,
  ],
  vista: () => ['Elige la vista de orador o de galería, la que deje el video fijado más grande.'],
  camara: () => ['Comprueba que tu cámara está encendida y que te ves bien.'],
};

const TEXTOS: Record<MeetingProvider, Textos> = {
  [MeetingProvider.ZOOM]: ZOOM,
  [MeetingProvider.GOOGLE_MEET]: MEET,
  [MeetingProvider.MICROSOFT_TEAMS]: TEAMS,
  [MeetingProvider.MANUAL]: GENERICA,
  [MeetingProvider.DAILY]: GENERICA,
};

const NOMBRE: Record<MeetingProvider, string> = {
  [MeetingProvider.ZOOM]: ALLOWED_MEETING_PROVIDER_LABELS.ZOOM,
  [MeetingProvider.GOOGLE_MEET]: ALLOWED_MEETING_PROVIDER_LABELS.GOOGLE_MEET,
  [MeetingProvider.MICROSOFT_TEAMS]: ALLOWED_MEETING_PROVIDER_LABELS.MICROSOFT_TEAMS,
  [MeetingProvider.MANUAL]: 'tu plataforma',
  [MeetingProvider.DAILY]: 'tu plataforma',
};

/**
 * Los pasos para llegar a la clase viendo bien a quien signa. Sin subtítulos
 * declarados, fijar el video va primero; con `LIVE_CAPTIONS`, los subtítulos.
 */
export function guiaDePlataforma(
  proveedor: MeetingProvider,
  modo: InstructionMode | null | undefined,
  apoyos: ClassroomSupport[],
): GuiaPlataforma {
  const textos = TEXTOS[proveedor];
  const persona = personaQueSigna(modo).de;
  const orden: ClavePaso[] = apoyos.includes(ClassroomSupport.LIVE_CAPTIONS)
    ? ['subtitulos', 'fijar-video', 'vista', 'camara']
    : ['fijar-video', 'subtitulos', 'vista', 'camara'];

  return {
    titulo: `Antes de entrar a ${NOMBRE[proveedor]}`,
    pasos: orden.map((clave) => ({
      clave,
      icono: ICONOS[clave],
      partes: textos[clave](persona),
    })),
  };
}
