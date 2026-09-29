import {
  BookingStatus,
  type ClassroomListItem,
  ClassroomStatus,
  EnglishLevel,
  MeetingProvider,
  ProblemaClase,
  SeguimientoClase,
} from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMisReservas } from '@/features/aulas/api/get-mis-reservas';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { crearValoracion } from '../api/crear-valoracion';
import { ResumenValoracion } from './resumen-valoracion';
import { TarjetaValoracion } from './tarjeta-valoracion';

vi.mock('@/features/aulas/api/get-mis-reservas', () => ({ getMisReservas: vi.fn() }));
vi.mock('../api/crear-valoracion', () => ({ crearValoracion: vi.fn() }));

function reservaPasada(overrides: Partial<ClassroomListItem> = {}): ClassroomListItem {
  return {
    id: 'aula-1',
    teacherId: 'teacher-1',
    title: 'Conversación cotidiana',
    description: 'Saludos y presentaciones.',
    level: EnglishLevel.BEGINNER,
    maxStudents: 8,
    currentBookings: 3,
    scheduledAt: '2020-08-12T23:00:00.000Z',
    durationMinutes: 60,
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    instructionMode: null,
    supports: [],
    createdAt: '2020-08-01T10:00:00.000Z',
    updatedAt: '2020-08-01T10:00:00.000Z',
    teacherFirstName: 'Paula',
    teacherLastName: 'Profesora',
    myBookingStatus: BookingStatus.ATTENDED,
    myBookingId: 'reserva-1',
    myBookingCancelable: null,
    accessState: 'sin-acceso',
    accessOpensAt: null,
    puedeValorar: true,
    ...overrides,
  };
}

function darReservas(items: ClassroomListItem[]) {
  vi.mocked(getMisReservas).mockResolvedValue({
    items,
    total: items.length,
    page: 1,
    pageSize: 10,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(crearValoracion).mockResolvedValue({ enviada: true });
});

describe('TarjetaValoracion (AC4, AC5)', () => {
  it('pregunta por la clase más reciente con puedeValorar y pasa axe', async () => {
    darReservas([
      reservaPasada({ id: 'a', title: 'Ya valorada', puedeValorar: false }),
      reservaPasada({ id: 'b', title: 'Gramática básica' }),
    ]);

    const { container } = renderConProviders(<TarjetaValoracion />);

    expect(
      await screen.findByText('¿Pudiste seguir la clase Gramática básica?'),
    ).toBeInTheDocument();
    await esperarSinFallosDeAccesibilidad(container);
  });

  it('no pinta nada si ninguna reserva se puede valorar', async () => {
    darReservas([reservaPasada({ puedeValorar: false })]);

    renderConProviders(<TarjetaValoracion />);

    await vi.waitFor(() => expect(getMisReservas).toHaveBeenCalled());
    expect(screen.queryByText(/Pudiste seguir la clase/)).not.toBeInTheDocument();
  });

  it('«Sí» envía en un solo paso y la tarjeta se reemplaza por el agradecimiento', async () => {
    darReservas([reservaPasada()]);
    const { user } = renderConProviders(<TarjetaValoracion />);

    await user.click(await screen.findByRole('button', { name: 'Sí' }));

    expect(crearValoracion).toHaveBeenCalledWith('reserva-1', { seguimiento: SeguimientoClase.SI });
    expect(
      await screen.findByText('Gracias. Se lo contamos al profesor sin decir tu nombre.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sí' })).not.toBeInTheDocument();
  });

  it('«A medias» ofrece los problemas y el envío es opcional en detalle', async () => {
    darReservas([reservaPasada()]);
    const { user } = renderConProviders(<TarjetaValoracion />);

    await user.click(await screen.findByRole('button', { name: 'A medias' }));
    expect(crearValoracion).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox', { name: 'Los subtítulos' }));
    await user.click(screen.getByRole('button', { name: 'Enviar respuesta' }));

    expect(crearValoracion).toHaveBeenCalledWith('reserva-1', {
      seguimiento: SeguimientoClase.A_MEDIAS,
      problemas: [ProblemaClase.SUBTITULOS],
    });
  });

  it('«No» se puede enviar sin elegir ningún problema', async () => {
    darReservas([reservaPasada()]);
    const { user } = renderConProviders(<TarjetaValoracion />);

    await user.click(await screen.findByRole('button', { name: 'No' }));
    await user.click(screen.getByRole('button', { name: 'Enviar respuesta' }));

    expect(crearValoracion).toHaveBeenCalledWith('reserva-1', {
      seguimiento: SeguimientoClase.NO,
    });
  });
});

describe('ResumenValoracion (AC3)', () => {
  it('con null explica que faltan respuestas', () => {
    renderConProviders(<ResumenValoracion valoracion={null} />);

    expect(screen.getByText('Aún no hay suficientes respuestas para mostrar.')).toBeInTheDocument();
  });

  it('con agregado muestra los conteos y los problemas más citados en texto', () => {
    renderConProviders(
      <ResumenValoracion
        valoracion={{
          respuestas: 8,
          si: 6,
          aMedias: 2,
          no: 0,
          problemas: { INTERPRETE: 0, SUBTITULOS: 2, CONEXION: 0, RITMO: 1, OTRO: 0 },
        }}
      />,
    );

    expect(screen.getByText('8 respuestas · 6 sí · 2 a medias')).toBeInTheDocument();
    expect(
      screen.getByText('Lo más citado: Los subtítulos (2), El ritmo de la clase (1)'),
    ).toBeInTheDocument();
  });
});
