import { UserRole, type ClassroomListItem, type MisReservasResponse } from '@academia/types';
import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { getMisReservas } from '@/features/aulas/api/get-mis-reservas';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { useAvisoAperturaStore } from '@/stores/aviso-apertura-store';
import { AvisoAperturaDeClase } from './aviso-apertura-de-clase';
import { InterruptorAvisoNavegador } from './interruptor-aviso-navegador';

vi.mock('@/features/aulas/api/get-mis-reservas', () => ({ getMisReservas: vi.fn() }));

const AHORA = new Date('2026-09-28T15:00:00.000Z');

function respuesta(accessState: 'aun-no' | 'abierto'): MisReservasResponse {
  const reserva = {
    id: 'aula-1',
    title: 'Conversación cotidiana',
    scheduledAt: new Date(AHORA.getTime() + 10 * 60_000).toISOString(),
    durationMinutes: 60,
    accessState,
    accessOpensAt:
      accessState === 'aun-no' ? new Date(AHORA.getTime() + 30_000).toISOString() : null,
  } as ClassroomListItem;
  return { items: [reserva], total: 1, page: 1, pageSize: 1 };
}

function pantalla() {
  return renderConProviders(
    <>
      <AvisoAperturaDeClase />
      <PaginaCabecera titulo="Tu panel" />
    </>,
  );
}

async function pasar(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

class NotificacionFalsa {
  static permission = 'granted';
  static requestPermission = vi.fn();
  static creadas: NotificacionFalsa[] = [];
  onclick: (() => void) | null = null;
  constructor(
    public titulo: string,
    public opciones?: NotificationOptions,
  ) {
    NotificacionFalsa.creadas.push(this);
  }
  close() {}
}

beforeEach(() => {
  darSesion(UserRole.STUDENT);
  useAvisoAperturaStore.setState({
    esperando: {},
    avisadas: {},
    aviso: null,
    notificarEnNavegador: false,
  });
  NotificacionFalsa.creadas = [];
  NotificacionFalsa.permission = 'granted';
  NotificacionFalsa.requestPermission.mockReset();
  vi.stubGlobal('Notification', NotificacionFalsa);
  vi.mocked(getMisReservas).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('aviso de apertura', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, now: AHORA });
  });

  it('si el servidor aún responde cerrado, no hay aviso aunque pase la hora', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(respuesta('aun-no'));
    pantalla();

    await pasar(35_000);

    expect(screen.queryByText(/ya abrió/)).not.toBeInTheDocument();
    expect(document.title).toBe('Tu panel · BigHearts');
  });

  it('con el servidor abierto cambian el título y aparece el callout', async () => {
    vi.mocked(getMisReservas)
      .mockResolvedValueOnce(respuesta('aun-no'))
      .mockResolvedValue(respuesta('abierto'));
    pantalla();

    await pasar(35_000);

    await waitFor(() =>
      expect(screen.getByText('Tu clase Conversación cotidiana ya abrió')).toBeInTheDocument(),
    );
    expect(document.title).toBe('● Ya puedes entrar · Conversación cotidiana');
    expect(screen.getByRole('link', { name: 'Ir a la clase' })).toHaveAttribute(
      'href',
      '/aulas/aula-1',
    );
  });

  it('una clase que ya estaba abierta al cargar no avisa', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(respuesta('abierto'));
    pantalla();

    await pasar(2_000);

    expect(screen.queryByText(/ya abrió/)).not.toBeInTheDocument();
  });

  it('notifica una sola vez por apertura aunque se cambie de pantalla', async () => {
    useAvisoAperturaStore.setState({ notificarEnNavegador: true });
    vi.mocked(getMisReservas)
      .mockResolvedValueOnce(respuesta('aun-no'))
      .mockResolvedValue(respuesta('abierto'));

    const primera = pantalla();
    await pasar(35_000);
    await waitFor(() => expect(NotificacionFalsa.creadas).toHaveLength(1));
    primera.unmount();

    vi.mocked(getMisReservas).mockResolvedValue(respuesta('abierto'));
    pantalla();
    await pasar(2_000);

    expect(NotificacionFalsa.creadas).toHaveLength(1);
  });
});

describe('permiso de notificaciones', () => {
  it('no se pide al montar, solo al activar el interruptor', async () => {
    NotificacionFalsa.permission = 'default';
    NotificacionFalsa.requestPermission.mockResolvedValue('denied');
    vi.mocked(getMisReservas).mockResolvedValue(respuesta('aun-no'));

    const { user } = renderConProviders(
      <>
        <AvisoAperturaDeClase />
        <InterruptorAvisoNavegador />
      </>,
    );
    expect(NotificacionFalsa.requestPermission).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('switch', { name: 'Avisarme en el navegador cuando se abra mi clase' }),
    );

    expect(NotificacionFalsa.requestPermission).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/bloqueadas las notificaciones/)).toBeInTheDocument();
  });
});
