import { type EntradaAdmin, TipoEntrada, TramoModulo, UserRole } from '@academia/types';
import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import { getEntradasAdmin } from '@/features/admin/diccionario/api/admin-diccionario';
import { getSinSena } from '@/features/admin/diccionario/api/medios';
import { subirSena } from '@/features/admin/diccionario/lib/subir-sena';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/admin/diccionario/api/admin-diccionario', () => ({
  getEntradasAdmin: vi.fn(),
  getAvance: vi.fn(),
  getModulosAdmin: vi.fn(),
  getCategoriasAdmin: vi.fn(),
}));
vi.mock('@/features/admin/diccionario/api/medios', () => ({ getSinSena: vi.fn() }));
vi.mock('@/features/admin/diccionario/lib/subir-sena', () => ({ subirSena: vi.fn() }));
vi.mock('@/features/admin/diccionario/lib/validar-video', async (original) => ({
  ...(await original<typeof import('@/features/admin/diccionario/lib/validar-video')>()),
  validarVideo: vi.fn(() =>
    Promise.resolve({ ok: true, duracionMs: 5000, video: document.createElement('video') }),
  ),
}));

const MODULO = { id: 'm1', numero: 1, nombre: 'Level I', tramo: TramoModulo.BASICO };

const entrada = (slug: string, ingles: string): EntradaAdmin => ({
  id: `id-${slug}`,
  slug,
  ingles,
  espanol: ingles,
  tipo: TipoEntrada.VERBO,
  nota: null,
  publicada: true,
  orden: 1,
  modulo: MODULO,
  unidad: { id: 'u1', codigo: 'U1', nombre: 'Need, Want' },
  categoria: { id: 'c1', slug: 'acciones', nombre: 'Acciones', icono: 'activity' },
  sena: { estado: 'sin-sena' },
  tieneImagen: false,
  updatedAt: '2026-11-17T00:00:00.000Z',
});

const ENTRADAS = [
  entrada('to-eat', 'To eat'),
  entrada('to-wash', 'To wash'),
  entrada('to-read', 'To read'),
];
const mp4 = (nombre: string) => new File(['x'], nombre, { type: 'video/mp4' });

function montar() {
  const vista = renderConProviders(<AppRoutes />, { ruta: '/admin/diccionario/grabacion' });
  const selector = () =>
    vista.container.querySelector<HTMLInputElement>('input[type="file"][multiple]');
  return { ...vista, selector };
}

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.ADMIN);
  vi.mocked(getEntradasAdmin).mockResolvedValue({
    items: ENTRADAS,
    total: ENTRADAS.length,
    page: 1,
    pageSize: 100,
    conteosSena: { lista: 0, procesando: 0, error: 0, 'sin-sena': 3 },
  });
  vi.mocked(getSinSena).mockResolvedValue({
    entradas: ENTRADAS.map((e) => ({
      id: e.id,
      slug: e.slug,
      ingles: e.ingles,
      inglesNorm: e.ingles.toLowerCase(),
      modulo: MODULO,
      unidad: { codigo: 'U1', nombre: 'Need, Want' },
      categoria: e.categoria,
      sena: { estado: 'sin-sena' as const },
    })),
  });
});

describe('AdminColaGrabacionPage', () => {
  it('empareja por nombre, deja a mano lo que no coincide y pregunta antes de salir con subidas en curso', async () => {
    vi.mocked(subirSena).mockReturnValue(new Promise(() => {}));
    const { user, selector } = montar();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Elegir videos' })).toBeEnabled(),
    );

    await user.upload(selector() as HTMLInputElement, [mp4('to-eat.mp4'), mp4('to-wach.mp4')]);

    expect(
      await screen.findByText(/2 archivos/, { selector: '[role="status"] strong' }),
    ).toBeInTheDocument();
    const lista = screen.getByRole('list', { name: 'Archivos para subir' });
    await waitFor(() => expect(within(lista).getByText('Subiendo')).toBeInTheDocument());
    expect(within(lista).getByText('Sin emparejar')).toBeInTheDocument();

    await user.click(within(lista).getByRole('button', { name: 'Usar «To wash»' }));
    await waitFor(() => expect(subirSena).toHaveBeenCalledTimes(2));

    await user.click(screen.getByRole('link', { name: 'Panel' }));
    const dialogo = await screen.findByRole('alertdialog');
    expect(within(dialogo).getByRole('button', { name: 'Seguir aquí' })).toHaveFocus();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cola de grabación', hidden: true }),
    ).toBeInTheDocument();
  });

  it('pasa axe', async () => {
    const { container } = montar();
    await screen.findByText('Sin seña lista');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Elegir videos' })).toBeEnabled(),
    );
    await esperarSinFallosDeAccesibilidad(container);
  });
});
