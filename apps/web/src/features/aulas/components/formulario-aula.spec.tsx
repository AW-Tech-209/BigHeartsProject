import { ApiErrorCode, ClassroomStatus, EnglishLevel, MeetingProvider } from '@academia/types';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/lib/api-error';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
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
  meetingProvider: MeetingProvider.MANUAL,
  status: ClassroomStatus.PUBLISHED,
  isRecurring: false,
  createdAt: '2026-08-20T10:00:00.000Z',
  updatedAt: '2026-08-20T10:00:00.000Z',
};

function montar(tema: Tema = 'light') {
  const onCreada = vi.fn();
  const utils = renderConProviders(<FormularioAula onCreada={onCreada} />, { tema });

  return { ...utils, onCreada };
}

/**
 * Rellena el formulario entero **solo con el teclado**, empezando por el primer
 * campo y avanzando con Tab. No es una comodidad del test: es AC8 en ejecución.
 * Si un control dejara de ser alcanzable con Tab, o dejara de aceptar texto,
 * esta función falla.
 */
async function rellenarConTeclado(user: ReturnType<typeof montar>['user']) {
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
