import {
  AccionLote,
  type EntradaAdmin,
  EstadoModulo,
  TipoEntrada,
  TramoModulo,
  UserRole,
} from '@academia/types';
import { screen, waitFor, within } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import {
  aplicarLote,
  editarEntrada,
  getAvance,
  getCategoriasAdmin,
  getEntradasAdmin,
  getModulosAdmin,
  getPapelera,
  restaurarEntrada,
} from '@/features/admin/diccionario/api/admin-diccionario';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/admin/diccionario/api/admin-diccionario', () => ({
  getAvance: vi.fn(),
  getEntradasAdmin: vi.fn(),
  editarEntrada: vi.fn(),
  aplicarLote: vi.fn(),
  getModulosAdmin: vi.fn(),
  getCategoriasAdmin: vi.fn(),
  getPapelera: vi.fn(),
  restaurarEntrada: vi.fn(),
  eliminarParaSiempre: vi.fn(),
  vaciarPapelera: vi.fn(),
}));

const MODULO = { id: 'm1', numero: 1, nombre: 'Level I', tramo: TramoModulo.BASICO };
const ACCIONES = { id: 'c1', slug: 'acciones', nombre: 'Acciones', icono: 'activity' };

const entrada = (id: string, ingles: string, espanol: string): EntradaAdmin => ({
  id,
  slug: id,
  ingles,
  espanol,
  tipo: TipoEntrada.VERBO,
  nota: null,
  publicada: true,
  orden: 1,
  modulo: MODULO,
  unidad: { id: 'u1', codigo: 'U1', nombre: 'Need, Want' },
  categoria: ACCIONES,
  sena: { estado: 'lista' },
  tieneImagen: false,
  updatedAt: '2026-11-01T00:00:00.000Z',
});

const TO_EAT = entrada('e1', 'To eat', 'Comer');
const TO_DRINK = entrada('e2', 'To drink', 'Tomar, beber');

function Ubicacion() {
  const { pathname, search } = useLocation();
  return <output aria-label="Ubicación">{pathname + search}</output>;
}

function montar(ruta = '/admin/diccionario') {
  return renderConProviders(
    <>
      <AppRoutes />
      <Ubicacion />
    </>,
    { ruta },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAvance).mockResolvedValue({
    modulos: [{ ...MODULO, palabras: 203, conSena: 86, procesando: 1, conError: 1, sinSena: 115 }],
    totales: { sinSena: 115, enPapelera: 4 },
  });
  vi.mocked(getEntradasAdmin).mockResolvedValue({
    items: [TO_EAT, TO_DRINK],
    total: 2,
    page: 1,
    pageSize: 25,
    conteosSena: { lista: 2, procesando: 0, error: 0, 'sin-sena': 0 },
  });
  vi.mocked(getModulosAdmin).mockResolvedValue({
    modulos: [
      { ...MODULO, estado: EstadoModulo.DISPONIBLE, orden: 1, palabras: 203, unidades: [] },
    ],
  });
  vi.mocked(getCategoriasAdmin).mockResolvedValue({
    categorias: [{ ...ACCIONES, descripcion: null, orden: 1, palabras: 51 }],
  });
  vi.mocked(getPapelera).mockResolvedValue({ entradas: [], diasDeRetencion: 30 });
});

describe('AdminDiccionarioPage — autorización', () => {
  it.each([UserRole.STUDENT, UserRole.TEACHER])('un %s no ve la consola', (rol) => {
    darSesion(rol);
    montar();

    expect(
      screen.getByRole('heading', { level: 1, name: 'No tienes acceso a esta página' }),
    ).toBeInTheDocument();
    expect(getEntradasAdmin).not.toHaveBeenCalled();
  });

  it.each([UserRole.STUDENT, UserRole.TEACHER])('un %s no ve la papelera', (rol) => {
    darSesion(rol);
    montar('/admin/diccionario/papelera');

    expect(
      screen.getByRole('heading', { level: 1, name: 'No tienes acceso a esta página' }),
    ).toBeInTheDocument();
    expect(getPapelera).not.toHaveBeenCalled();
  });
});

describe('AdminDiccionarioPage — admin', () => {
  beforeEach(() => darSesion(UserRole.ADMIN));

  it('el avance se dice «N de M», nunca en porcentaje', async () => {
    montar();
    const barra = await screen.findByRole('progressbar', { name: 'Módulo 1' });
    expect(barra).toHaveAttribute('aria-valuetext', '86 de 203 con seña');
    expect(document.body.textContent).not.toMatch(/\d+\s*%/);
  });

  it('el filtro de módulo va a la URL y a la consulta', async () => {
    const { user } = montar();
    await screen.findByText('To eat');

    await user.selectOptions(screen.getByLabelText('Módulo'), '1');

    expect(screen.getByRole('status', { name: 'Ubicación' })).toHaveTextContent(
      '/admin/diccionario?modulo=1',
    );
    await waitFor(() =>
      expect(getEntradasAdmin).toHaveBeenLastCalledWith({ modulo: 1, pageSize: 25 }),
    );
  });

  it('Enter guarda la edición rápida sin mostrar el valor como guardado antes de tiempo', async () => {
    let responder: (e: EntradaAdmin) => void = () => {};
    vi.mocked(editarEntrada).mockImplementation(
      () => new Promise<EntradaAdmin>((r) => (responder = r)),
    );
    const { user } = montar();

    await user.click(await screen.findByRole('button', { name: 'Editar To drink' }));
    const espanol = screen.getByLabelText('Español');
    await user.clear(espanol);
    await user.type(espanol, 'Beber{Enter}');

    expect(editarEntrada).toHaveBeenCalledWith('e2', {
      ingles: 'To drink',
      espanol: 'Beber',
      tipo: TipoEntrada.VERBO,
    });
    expect(screen.getByRole('button', { name: /Guardando…/ })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Beber' })).not.toBeInTheDocument();

    responder({ ...TO_DRINK, espanol: 'Beber' });
    expect(await screen.findByText('To drink guardada')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Editar To drink' })).toHaveFocus(),
    );
  });

  it('Esc cancela la edición rápida sin guardar', async () => {
    const { user } = montar();

    await user.click(await screen.findByRole('button', { name: 'Editar To drink' }));
    await user.type(screen.getByLabelText('Español'), ' x');
    await user.keyboard('{Escape}');

    expect(editarEntrada).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Español')).not.toBeInTheDocument();
  });

  it('el lote envía los ids marcados y «Deshacer» los restaura', async () => {
    vi.mocked(aplicarLote).mockResolvedValue({ actualizadas: 2 });
    vi.mocked(restaurarEntrada).mockResolvedValue(undefined);
    const { user } = montar();

    await user.click(await screen.findByRole('checkbox', { name: 'Marcar To eat' }));
    await user.click(screen.getByRole('checkbox', { name: 'Marcar To drink' }));
    expect(screen.getByText('2 seleccionadas')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enviar a la papelera' }));

    expect(aplicarLote).toHaveBeenCalledWith({
      accion: AccionLote.ENVIAR_PAPELERA,
      ids: ['e1', 'e2'],
    });
    const aviso = await screen.findByText('2 entradas enviadas a la papelera');
    await user.click(
      within(aviso.parentElement as HTMLElement).getByRole('button', { name: 'Deshacer' }),
    );

    await waitFor(() => expect(restaurarEntrada).toHaveBeenCalledTimes(2));
    expect(restaurarEntrada).toHaveBeenCalledWith('e1', undefined);
    expect(restaurarEntrada).toHaveBeenCalledWith('e2', undefined);
  });

  it('pasa axe', async () => {
    const { container } = montar();
    await screen.findByText('To eat');
    await esperarSinFallosDeAccesibilidad(container);
  });

  it('la papelera vacía lo dice y pasa axe', async () => {
    const { container } = montar('/admin/diccionario/papelera');
    expect(await screen.findByText('La papelera está vacía.')).toBeInTheDocument();
    await esperarSinFallosDeAccesibilidad(container);
  });
});
