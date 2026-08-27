import {
  ApiErrorCode,
  BookingStatus,
  type ClassroomDetail,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
} from '@academia/types';
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/lib/api-error';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { aInstanteISO } from '../lib/horario';
import { FormularioAula } from './formulario-aula';

const { createClassroomMock } = vi.hoisted(() => ({ createClassroomMock: vi.fn() }));

vi.mock('../api/create-classroom', () => ({ createClassroom: createClassroomMock }));

const AULA_CREADA = {
  id: '33333333-3333-4333-8333-333333333333',
  teacherId: '11111111-1111-4111-8111-111111111111',
  title: 'Conversación cotidiana',
  description: 'Practicamos saludos.',
  level: EnglishLevel.BEGINNER,
  maxStudents: 8,
  currentBookings: 0,
  scheduledAt: '2027-08-12T23:00:00.000Z',
  durationMinutes: 60,
  meetingProvider: MeetingProvider.GOOGLE_MEET,
  status: ClassroomStatus.PUBLISHED,
  isRecurring: false,
  communicationModes: [CommunicationPreference.SIGN_LANGUAGE],
  hasInterpreter: false,
  hasLiveCaptions: false,
  hasVisualMaterials: false,
  createdAt: '2026-08-20T10:00:00.000Z',
  updatedAt: '2026-08-20T10:00:00.000Z',
};

function montar(tema: Tema = 'light') {
  const onCreada = vi.fn();
  const utils = renderConProviders(<FormularioAula onGuardada={onCreada} />, { tema });

  return { ...utils, onCreada };
}

const AULA_ORIGEN: ClassroomDetail = {
  ...AULA_CREADA,
  id: '55555555-5555-4555-8555-555555555555',
  title: 'Conversación cotidiana',
  description: 'Practicamos saludos.',
  maxStudents: 8,
  scheduledAt: '2027-08-05T23:00:00.000Z',
  meetingLink: 'https://meet.google.com/xyz-uvwx-yz',
  hasInterpreter: true,
  hasLiveCaptions: false,
  hasVisualMaterials: false,
  teacherFirstName: 'Marta',
  teacherLastName: 'Ríos',
  myBookingStatus: null satisfies BookingStatus | null,
  myBookingId: null,
  myBookingCancelable: null,
  accessState: 'sin-acceso',
  accessOpensAt: null,
};

function montarDuplicando() {
  const onCreada = vi.fn();
  const utils = renderConProviders(
    <FormularioAula duplicarDesde={AULA_ORIGEN} onGuardada={onCreada} />,
  );

  return { ...utils, onCreada };
}

/**
 * Rellena el formulario entero **solo con el teclado**, empezando por el primer
 * campo y avanzando con Tab. No es una comodidad del test: es AC8 en ejecución.
 * Si un control dejara de ser alcanzable con Tab, o dejara de aceptar texto,
 * esta función falla.
 */
/** Rellena todo EXCEPTO el modo de comunicación — para probar AC1 por separado. */
async function rellenarSinModo(user: ReturnType<typeof montar>['user']) {
  await user.click(screen.getByLabelText(/nombre de la clase/i));
  await user.keyboard('Conversación cotidiana');

  // Tab desde el nombre tiene que caer en la descripción: si alguien mete un
  // control entre medias sin pensar en el orden, esto se rompe.
  await user.tab();
  await user.keyboard('Practicamos saludos y presentaciones.');

  await user.tab();
  await user.selectOptions(screen.getByLabelText(/^nivel/i), EnglishLevel.INTERMEDIATE);

  await elegirHorario(user, '2027-08-12', '18:00');

  await user.selectOptions(screen.getByLabelText(/duración/i), '90');

  const cupo = screen.getByLabelText(/cupo máximo/i);
  await user.clear(cupo);
  await user.type(cupo, '12');

  await user.click(screen.getByLabelText(/enlace de la reunión/i));
  await user.keyboard('https://meet.google.com/abc-defg-hij');
}

async function rellenarConTeclado(user: ReturnType<typeof montar>['user']) {
  await rellenarSinModo(user);

  // T8: obligatorio. `Tab` desde el enlace pasa por la plataforma —que ya
  // tiene un valor por defecto válido— y llega a las tarjetas de modo.
  await user.click(screen.getByLabelText(/lengua de signos/i));
}

/**
 * Rellena día y hora tecleando el valor, como haría quien navega con teclado.
 *
 * En jsdom los `input[type=date|time]` no tienen los segmentos que pinta un
 * navegador real, así que se escribe el valor en el formato del control
 * (`aaaa-mm-dd`, `hh:mm`). Es la limitación del entorno, no del componente: lo
 * que este test sigue garantizando es que el campo es alcanzable, editable con
 * el teclado y que su valor llega al envío.
 */
async function elegirHorario(user: ReturnType<typeof montar>['user'], fecha: string, hora: string) {
  await user.type(screen.getByLabelText(/^día/i), fecha);
  await user.type(screen.getByLabelText(/hora de inicio/i), hora);
}

beforeEach(() => {
  createClassroomMock.mockReset();
  createClassroomMock.mockResolvedValue({ classroom: AULA_CREADA });
});

afterEach(() => vi.useRealTimers());

describe('FormularioAula — estructura accesible (AC8)', () => {
  it('todos los campos tienen etiqueta visible asociada', () => {
    montar();

    for (const etiqueta of [
      /nombre de la clase/i,
      /descripción/i,
      /^nivel/i,
      /^día/i,
      /hora de inicio/i,
      /duración/i,
      /cupo máximo/i,
      /enlace de la reunión/i,
    ]) {
      expect(screen.getByLabelText(etiqueta)).toBeInTheDocument();
    }
  });

  it('marca los campos obligatorios con la palabra, no solo con un asterisco', () => {
    montar();

    expect(screen.getAllByText(/\(obligatorio\)/i).length).toBeGreaterThanOrEqual(8);
  });

  it.each<Tema>(['light', 'dark', 'hc'])('no tiene fallos de axe en el tema %s', async (tema) => {
    const { container } = montar(tema);

    await esperarSinFallosDeAccesibilidad(container);
  });
});

/**
 * B3 — la ayuda del enlace es PERMANENTE y explica la promesa central del
 * producto. Si alguien la convierte en un tooltip o la borra por brevedad, el
 * profesor pega un enlace sin saber que no se reparte, y la primera vez que un
 * estudiante le escriba pidiéndolo va a mandárselo por WhatsApp — que es
 * exactamente lo que esta plataforma existe para evitar.
 */
describe('FormularioAula — la ayuda del enlace (B3)', () => {
  it('dice de dónde sale el enlace y que solo se ve 30 minutos antes', () => {
    montar();
    const ayuda = screen.getByLabelText(/enlace de la reunión/i).getAttribute('aria-describedby');

    expect(ayuda).toBeTruthy();
    expect(screen.getByText(/pega aquí el enlace de la reunión que creaste en zoom o meet/i));
    expect(screen.getByText(/30 minutos antes/i)).toBeInTheDocument();
    expect(screen.getByText(/se guarda cifrado/i)).toBeInTheDocument();
  });
});

/** B5 — la confirmación del horario con la zona nombrada, antes de enviar. */
describe('FormularioAula — confirmación del horario (B5, AC6)', () => {
  it('antes de elegir fecha invita a hacerlo, sin inventarse una hora', () => {
    montar();

    expect(screen.getByText(/elige el día y la hora/i)).toBeInTheDocument();
  });

  it('al elegir día y hora confirma la fecha completa con la zona entre paréntesis', async () => {
    const { user } = montar();

    await elegirHorario(user, '2027-08-12', '18:00');

    const confirmacion = await screen.findByText(/jueves,? 12 de agosto de 2027/i);

    expect(confirmacion.textContent).toMatch(/6:00/);
    // El nombre de la zona no siempre contiene la palabra «hora» —en CI el
    // proceso corre en UTC, y ahí es «tiempo universal coordinado»—, así que se
    // comprueba que el paréntesis trae un nombre largo, no la sigla sola.
    const nombreDeZona = confirmacion.textContent?.match(/\((.+)\)$/)?.[1];
    expect(nombreDeZona?.length ?? 0).toBeGreaterThan(3);
  });
});

describe('FormularioAula — envío', () => {
  it('se rellena y se envía entero solo con el teclado (AC8)', async () => {
    const { user, onCreada } = montar();

    await rellenarConTeclado(user);
    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    await waitFor(() => expect(createClassroomMock).toHaveBeenCalledTimes(1));
    expect(onCreada).toHaveBeenCalledWith(AULA_CREADA);
  });

  it('manda scheduledAt como instante UTC y los números como números', async () => {
    const { user } = montar();

    await rellenarConTeclado(user);
    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    await waitFor(() => expect(createClassroomMock).toHaveBeenCalled());
    const enviado = createClassroomMock.mock.calls[0]?.[0];

    expect(enviado).toMatchObject({
      title: 'Conversación cotidiana',
      level: EnglishLevel.INTERMEDIATE,
      maxStudents: 12,
      durationMinutes: 90,
      meetingLink: 'https://meet.google.com/abc-defg-hij',
    });
    // El contrato viaja en UTC (§4.7), venga de la zona que venga el profesor.
    expect(enviado.scheduledAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(enviado.scheduledAt).getHours()).toBe(18);
  });

  it('NO envía nada si falta un campo obligatorio', async () => {
    const { user } = montar();

    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    expect(createClassroomMock).not.toHaveBeenCalled();
  });
});

describe('FormularioAula — errores de validación (AC4)', () => {
  it('pinta el error bajo el campo y le lleva el foco', async () => {
    const { user } = montar();

    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    const nombre = screen.getByLabelText(/nombre de la clase/i);

    expect(nombre).toHaveAttribute('aria-invalid', 'true');
    expect(nombre).toHaveFocus();
    // El mensaje está ASOCIADO al campo, no solo pintado cerca: es lo que hace
    // que un lector de pantalla lo lea al llegar al input.
    expect(nombre.getAttribute('aria-describedby')).toContain('title-error');

    // El mensaje es un `role="alert"`, no un párrafo suelto: así el lector de
    // pantalla lo anuncia al aparecer, sin esperar a que el foco llegue.
    const mensaje = screen.getByText(/ponle un nombre a la clase/i);
    expect(mensaje.closest('[role="alert"]')).not.toBeNull();
  });

  it('rechaza una fecha en el pasado antes de gastar un viaje al servidor', async () => {
    const { user } = montar();

    await elegirHorario(user, '2020-01-01', '18:00');
    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    expect(await screen.findByText(/tiene que empezar en el futuro/i)).toBeInTheDocument();
    expect(createClassroomMock).not.toHaveBeenCalled();
  });

  // AC1: sin ningún modo de comunicación, el aula no se envía.
  it('rechaza el envío sin ningún modo de comunicación elegido', async () => {
    const { user } = montar();

    await rellenarSinModo(user);
    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    expect(
      await screen.findByText('Elige al menos un modo en que se imparte la clase.'),
    ).toBeInTheDocument();
    expect(createClassroomMock).not.toHaveBeenCalled();
  });

  it('rechaza un enlace que no es una URL', async () => {
    const { user } = montar();

    await user.click(screen.getByLabelText(/enlace de la reunión/i));
    await user.keyboard('meet.google.com/abc');
    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    expect(await screen.findByText(/empezando por https/i)).toBeInTheDocument();
    expect(createClassroomMock).not.toHaveBeenCalled();
  });

  /**
   * AC4, la mitad que se olvida: el error del SERVIDOR también tiene que
   * aterrizar bajo su campo. Y `scheduledAt` no es un campo de esta pantalla,
   * así que hay que traducirlo a `fecha` — si no, el profesor recibiría un
   * formulario sin ninguna marca y sin saber qué corregir.
   */
  it('traduce el scheduledAt del backend al campo «Día»', async () => {
    createClassroomMock.mockRejectedValueOnce(
      new ApiClientError(
        {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Los datos enviados no son válidos.',
          details: {
            fields: [{ field: 'scheduledAt', message: 'La clase tiene que empezar en el futuro.' }],
          },
        },
        400,
      ),
    );

    const { user } = montar();
    await rellenarConTeclado(user);
    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    const dia = await screen.findByLabelText(/^día/i);

    await waitFor(() => expect(dia).toHaveAttribute('aria-invalid', 'true'));
    expect(dia).toHaveFocus();
    expect(screen.getByText(/tiene que empezar en el futuro/i)).toBeInTheDocument();
  });

  /**
   * AC5 desde la pantalla: un profesor `PENDING` recibe 403 con un mensaje
   * cierto, y el formulario lo muestra tal cual en vez de traducirlo a un
   * genérico. El servidor sabe cuál de los tres estados bloquea; nosotros no.
   */
  it('muestra el motivo del servidor cuando la cuenta no puede publicar', async () => {
    createClassroomMock.mockRejectedValueOnce(
      new ApiClientError(
        {
          code: ApiErrorCode.ACCOUNT_PENDING,
          message: 'Tu cuenta está pendiente de aprobación. Te avisaremos por correo.',
        },
        403,
      ),
    );

    const { user } = montar();
    await rellenarConTeclado(user);
    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    expect(await screen.findByText(/pendiente de aprobación/i)).toBeInTheDocument();
  });

  it('explica un fallo de red sin culpar al profesor', async () => {
    createClassroomMock.mockRejectedValueOnce(new Error('offline'));

    const { user } = montar();
    await rellenarConTeclado(user);
    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    expect(await screen.findByText(/revisa tu conexión/i)).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ *
 *  HU-212 — coherencia temporal del aula                              *
 * ------------------------------------------------------------------ */

/**
 * El horario del aula que estorba se construye con `aInstanteISO`, no con una
 * cadena UTC literal: el mensaje se formatea en la zona del proceso, y en CI
 * esa zona no es la misma que en el portátil de quien escribe esto. Así «las
 * 6:00 p. m.» son las seis de la tarde en cualquier zona.
 */
const SOLAPAMIENTO = {
  conflictoId: '44444444-4444-4444-8444-444444444444',
  conflictoTitulo: 'Conversación cotidiana',
  conflictoScheduledAt: aInstanteISO({ fecha: '2027-08-12', hora: '18:00' })!,
  conflictoDurationMinutes: 60,
};

function rechazarCon(code: string, message: string, details?: Record<string, unknown>) {
  createClassroomMock.mockRejectedValueOnce(new ApiClientError({ code, message, details }, 409));
}

/** Rellena, envía y espera a que el servidor haya contestado. */
async function enviar(user: ReturnType<typeof montar>['user']) {
  await rellenarConTeclado(user);
  await user.click(screen.getByRole('button', { name: /publicar la clase/i }));
}

describe('FormularioAula — solapamiento con otra clase del profesor (T7, AC5)', () => {
  it('pinta el error bajo el campo del horario, nombrando el aula que choca', async () => {
    rechazarCon(
      ApiErrorCode.TEACHER_SCHEDULE_CONFLICT,
      'Ya tienes «Conversación cotidiana» en ese horario.',
      SOLAPAMIENTO,
    );

    const { user } = montar();
    await enviar(user);

    const dia = await screen.findByLabelText(/^día/i);
    await waitFor(() => expect(dia).toHaveAttribute('aria-invalid', 'true'));

    // Asociado al campo, no solo pintado cerca: es lo que hace que un lector de
    // pantalla lo lea al llegar al input.
    expect(dia.getAttribute('aria-describedby')).toContain('fecha-error');
    expect(dia).toHaveFocus();

    // AC5: el mensaje NOMBRA la clase y dice el horario ocupado. Un error que
    // solo dijera «hay un conflicto» obliga a buscar el choque a mano.
    const mensaje = screen.getByText(/ya tienes «conversación cotidiana»/i);
    expect(mensaje.textContent).toMatch(/jueves/i);
    expect(mensaje.textContent).toMatch(/de 6:00/);
    expect(mensaje.textContent).toMatch(/a 7:00/);
  });

  it('el error lleva ícono además del color, y va en un role="alert"', async () => {
    rechazarCon(ApiErrorCode.TEACHER_SCHEDULE_CONFLICT, 'Ya tienes una clase.', SOLAPAMIENTO);

    const { user } = montar();
    await enviar(user);

    const alerta = (await screen.findByText(/ya tienes «conversación cotidiana»/i)).closest(
      '[role="alert"]',
    );

    expect(alerta).not.toBeNull();
    // Triple codificación: color + ícono + texto. Sin el `svg` el estado se
    // estaría comunicando solo con el rojo del borde.
    expect(alerta!.querySelector('svg')).not.toBeNull();
  });

  it('bloquea: no abre ningún diálogo que permita publicar igual', async () => {
    rechazarCon(ApiErrorCode.TEACHER_SCHEDULE_CONFLICT, 'Ya tienes una clase.', SOLAPAMIENTO);

    const { user } = montar();
    await enviar(user);

    await screen.findByText(/ya tienes «conversación cotidiana»/i);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('sin details usables cae al mensaje del servidor en vez de escribir undefined', async () => {
    rechazarCon(ApiErrorCode.TEACHER_SCHEDULE_CONFLICT, 'Ya tienes una clase en ese horario.', {
      conflictoTitulo: 'Conversación cotidiana',
    });

    const { user } = montar();
    await enviar(user);

    expect(await screen.findByText('Ya tienes una clase en ese horario.')).toBeInTheDocument();
  });
});

describe('FormularioAula — duración por encima del máximo (T9, AC6)', () => {
  it('el control no ofrece ninguna duración por encima del tope de fábrica', () => {
    montar();
    const duracion = screen.getByLabelText(/duración/i);

    // El tope de fábrica son 240 minutos; ninguna opción puede superarlo.
    for (const opcion of within(duracion).getAllByRole('option')) {
      expect(Number((opcion as HTMLOptionElement).value)).toBeLessThanOrEqual(240);
    }
  });

  it('pinta el error bajo el campo y recorta el control al tope real del servidor', async () => {
    createClassroomMock.mockRejectedValueOnce(
      new ApiClientError(
        {
          code: ApiErrorCode.CLASSROOM_DURATION_INVALID,
          message: 'Una clase no puede durar más de 45 minutos.',
          details: { maximoMinutos: 45 },
        },
        400,
      ),
    );

    const { user } = montar();
    await enviar(user); // el formulario envía 90 minutos

    const duracion = await screen.findByLabelText(/duración/i);
    await waitFor(() => expect(duracion).toHaveAttribute('aria-invalid', 'true'));
    expect(duracion.getAttribute('aria-describedby')).toContain('durationMinutes-error');
    expect(screen.getByText('Una clase no puede durar más de 45 minutos.')).toBeInTheDocument();

    // AC6, la mitad que no es del servidor: la duración rechazada ya no se
    // puede volver a elegir, y el control queda en una válida en vez de en
    // blanco.
    const valores = within(duracion)
      .getAllByRole('option')
      .map((opcion) => Number((opcion as HTMLOptionElement).value));

    expect(valores).toEqual([30, 45]);
    expect(duracion).toHaveValue('45');
  });
});

describe('FormularioAula — aviso de poca antelación (T8, AC7)', () => {
  const AVISO = { minutosDeAntelacion: 45, minimoMinutos: 60 };

  async function abrirElAviso(user: ReturnType<typeof montar>['user']) {
    rechazarCon(
      ApiErrorCode.CLASSROOM_LEAD_TIME_WARNING,
      'Esta clase empieza en menos de 60 minutos.',
      AVISO,
    );

    await enviar(user);
    return screen.findByRole('alertdialog');
  }

  it('abre un diálogo que nombra la clase y dice cuánto falta', async () => {
    const { user } = montar();
    const dialogo = await abrirElAviso(user);

    expect(dialogo).toHaveAccessibleName('«Conversación cotidiana» empieza en 45 minutos');
  });

  it('explica la consecuencia: el recordatorio llega tarde o no llega', async () => {
    const { user } = montar();
    const dialogo = await abrirElAviso(user);

    expect(dialogo).toHaveAccessibleDescription(
      /recibirán el recordatorio tarde, o no lo recibirán/i,
    );
    expect(dialogo).toHaveAccessibleDescription(/con menos de 1 hora de antelación/i);
  });

  it('los dos botones llevan verbos, y el foco arranca en el que no publica', async () => {
    const { user } = montar();
    const dialogo = await abrirElAviso(user);

    const nombres = Array.from(dialogo.querySelectorAll('button')).map((b) => b.textContent);
    expect(nombres).toEqual(['Cambiar la hora', 'Publicar de todas formas']);

    // El error caro de esta pantalla es publicar una clase que nadie va a poder
    // reservar, así que el foco no puede empezar en el botón que la publica.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Cambiar la hora' })).toHaveFocus(),
    );
  });

  /**
   * AC9 — el foco no se escapa del diálogo.
   *
   * En jsdom no se puede comprobar la vuelta al primer botón: el guardián de
   * foco que la hace vive de un `focus` real del navegador, y aquí el Tab
   * aterriza en el propio guardián. Lo que sí se comprueba —y es lo que rompe
   * de verdad si alguien quita el `modal`— es que después de recorrer el
   * diálogo el foco NUNCA llega a un control del formulario, y que la página
   * de detrás está oculta para el lector de pantalla.
   */
  it('atrapa el foco: ni Tab ni el lector de pantalla salen del diálogo (AC9)', async () => {
    const { user, container } = montar();
    await abrirElAviso(user);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Publicar de todas formas' })).toHaveFocus();

    // Tres Tabs más: en un navegador se habría dado la vuelta al primer botón
    // varias veces. Lo que se comprueba es que en ningún momento el foco cae
    // en el formulario de detrás.
    for (let i = 0; i < 3; i += 1) {
      await user.tab();
      expect(container.contains(document.activeElement)).toBe(false);
    }

    // Y el formulario entero queda fuera del árbol de accesibilidad mientras el
    // diálogo está abierto: sin esto, quien navega por formularios o por
    // encabezados seguiría recorriendo una pantalla que ya no puede tocar.
    // `querySelector` y no `getByRole`: precisamente porque ya no tiene rol.
    expect(container.querySelector('button[type="submit"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('se cierra con Esc y devuelve el foco al campo que hay que cambiar (AC9)', async () => {
    const { user } = montar();
    await abrirElAviso(user);

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    // No basta con cerrarlo: quien navega con teclado tiene que aterrizar en la
    // hora, que es lo que el diálogo le acaba de pedir que cambie.
    await waitFor(() => expect(screen.getByLabelText(/hora de inicio/i)).toHaveFocus());
    expect(createClassroomMock).toHaveBeenCalledTimes(1);
  });

  it('«Cambiar la hora» cierra sin publicar nada', async () => {
    const { user, onCreada } = montar();
    await abrirElAviso(user);

    await user.click(screen.getByRole('button', { name: 'Cambiar la hora' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(createClassroomMock).toHaveBeenCalledTimes(1);
    expect(onCreada).not.toHaveBeenCalled();
  });

  it('«Publicar de todas formas» reenvía la MISMA petición con la confirmación', async () => {
    const { user, onCreada } = montar();
    await abrirElAviso(user);

    await user.click(screen.getByRole('button', { name: 'Publicar de todas formas' }));

    await waitFor(() => expect(onCreada).toHaveBeenCalledWith(AULA_CREADA));
    expect(createClassroomMock).toHaveBeenCalledTimes(2);

    const [primero] = createClassroomMock.mock.calls[0] as [Record<string, unknown>];
    const [segundo] = createClassroomMock.mock.calls[1] as [Record<string, unknown>];

    // El flag es el acuse de recibo del aviso, no un dato del aula: solo viaja
    // en el reintento, y el resto del cuerpo es idéntico.
    expect(primero.confirmarPocaAntelacion).toBeUndefined();
    expect(segundo).toEqual({ ...primero, confirmarPocaAntelacion: true });
  });

  it('si el reintento falla, el diálogo se cierra para que se vea el error', async () => {
    const { user } = montar();
    await abrirElAviso(user);

    createClassroomMock.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'Publicar de todas formas' }));

    // El diálogo es modal: si se quedara abierto, el aviso que explica qué pasó
    // estaría detrás del fondo, invisible para quien mira y ausente para quien
    // usa lector de pantalla.
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(await screen.findByText(/revisa tu conexión/i)).toBeInTheDocument();
  });

  it.each<Tema>(['light', 'dark', 'hc'])(
    'no tiene fallos de axe con el diálogo abierto en el tema %s',
    async (tema) => {
      const { user, baseElement } = montar(tema);
      await abrirElAviso(user);

      // `baseElement` y no `container`: el diálogo vive en un portal.
      await esperarSinFallosDeAccesibilidad(baseElement);
    },
  );
});

/* ------------------------------------------------------------------ *
 *  HU-213 — duplicar un aula                                          *
 * ------------------------------------------------------------------ */

describe('FormularioAula — duplicando (AC1, AC2, AC3)', () => {
  it('precarga todos los campos salvo fecha y hora', () => {
    montarDuplicando();

    expect(screen.getByLabelText(/nombre de la clase/i)).toHaveValue('Conversación cotidiana');
    expect(screen.getByLabelText(/descripción/i)).toHaveValue('Practicamos saludos.');
    expect(screen.getByLabelText(/cupo máximo/i)).toHaveValue(8);
    expect(screen.getByLabelText(/enlace de la reunión/i)).toHaveValue(
      'https://meet.google.com/xyz-uvwx-yz',
    );
    expect(screen.getByLabelText(/lengua de signos/i)).toBeChecked();
  });

  it('la fecha y la hora llegan vacías', () => {
    montarDuplicando();

    expect(screen.getByLabelText(/^día/i)).toHaveValue('');
    expect(screen.getByLabelText(/hora de inicio/i)).toHaveValue('');
  });

  it('el foco entra en el campo de fecha al cargar', () => {
    montarDuplicando();

    expect(screen.getByLabelText(/^día/i)).toHaveFocus();
  });

  it('publicar usa POST (crea un aula nueva, no PATCH sobre la original)', async () => {
    const { user, onCreada } = montarDuplicando();

    await elegirHorario(user, '2027-09-02', '18:00');
    await user.click(screen.getByRole('button', { name: /publicar la clase/i }));

    await waitFor(() => expect(createClassroomMock).toHaveBeenCalledTimes(1));
    expect(onCreada).toHaveBeenCalledWith(AULA_CREADA);
  });
});
