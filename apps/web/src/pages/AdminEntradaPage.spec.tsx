import {
  type EntradaAdmin,
  EstadoModulo,
  TipoEntrada,
  TramoModulo,
  UserRole,
} from '@academia/types';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import {
  buscarDuplicados,
  crearEntrada,
  getCategoriasAdmin,
  getModulosAdmin,
} from '@/features/admin/diccionario/api/admin-diccionario';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/admin/diccionario/api/admin-diccionario', () => ({
  getAvance: vi.fn(),
  getEntradasAdmin: vi.fn(),
  getEntradaAdmin: vi.fn(),
  crearEntrada: vi.fn(),
  editarEntrada: vi.fn(),
  buscarDuplicados: vi.fn(),
  enviarAPapelera: vi.fn(),
  aplicarLote: vi.fn(),
  getModulosAdmin: vi.fn(),
  getCategoriasAdmin: vi.fn(),
  getPapelera: vi.fn(),
  restaurarEntrada: vi.fn(),
  eliminarParaSiempre: vi.fn(),
  vaciarPapelera: vi.fn(),
}));

const unidad = (id: string, codigo: string, nombre: string) => ({
  id,
  codigo,
  nombre,
  orden: 1,
  palabras: 0,
});

const MODULOS = [
  {
    id: 'm1',
    numero: 1,
    nombre: 'Level I',
    tramo: TramoModulo.BASICO,
    estado: EstadoModulo.DISPONIBLE,
    orden: 1,
    palabras: 203,
    unidades: [unidad('u11', 'U1', 'Need, Want')],
  },
  {
    id: 'm2',
    numero: 2,
    nombre: 'Level II',
    tramo: TramoModulo.BASICO,
    estado: EstadoModulo.DISPONIBLE,
    orden: 2,
    palabras: 167,
    unidades: [unidad('u21', 'U1', 'Daily life')],
  },
];

const guardada = (ingles: string): EntradaAdmin => ({
  id: `id-${ingles}`,
  slug: ingles.toLowerCase().replace(/\s+/g, '-'),
  ingles,
  espanol: 'x',
  tipo: TipoEntrada.VERBO,
  nota: null,
  publicada: true,
  orden: 99,
  modulo: { id: 'm2', numero: 2, nombre: 'Level II', tramo: TramoModulo.BASICO },
  unidad: { id: 'u21', codigo: 'U1', nombre: 'Daily life' },
  categoria: { id: 'c1', slug: 'acciones', nombre: 'Acciones', icono: 'activity' },
  sena: { estado: 'sin-sena' },
  tieneImagen: false,
  updatedAt: '2026-11-17T00:00:00.000Z',
});

function montar() {
  return renderConProviders(<AppRoutes />, { ruta: '/admin/diccionario/entrada/nueva' });
}

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.ADMIN);
  vi.mocked(getModulosAdmin).mockResolvedValue({ modulos: MODULOS });
  vi.mocked(getCategoriasAdmin).mockResolvedValue({
    categorias: [
      {
        id: 'c1',
        slug: 'acciones',
        nombre: 'Acciones',
        icono: 'activity',
        descripcion: null,
        orden: 1,
        palabras: 51,
      },
    ],
  });
  vi.mocked(buscarDuplicados).mockResolvedValue({ duplicados: [] });
});

describe('AdminEntradaPage — crear', () => {
  it('no deja guardar sin inglés y lo dice', async () => {
    const { user } = montar();
    const guardar = await screen.findByRole('button', { name: 'Guardar' });

    expect(guardar).toHaveAttribute('aria-disabled', 'true');
    expect(guardar).toHaveAccessibleDescription('Escribe el inglés y el español para guardar.');
    await user.click(guardar);

    expect(crearEntrada).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Inglés')).toHaveAccessibleDescription(
      'Escribe la palabra o frase en inglés.',
    );
  });

  it('cambiar el módulo vacía la unidad', async () => {
    const { user } = montar();
    await user.selectOptions(await screen.findByLabelText('Módulo'), 'm1');
    await user.selectOptions(screen.getByLabelText('Unidad'), 'u11');

    await user.selectOptions(screen.getByLabelText('Módulo'), 'm2');

    expect(screen.getByLabelText('Unidad')).toHaveValue('');
  });

  it('el aviso de duplicado aparece al salir del inglés y no bloquea', async () => {
    vi.mocked(buscarDuplicados).mockResolvedValue({
      duplicados: [
        {
          id: 'd1',
          slug: 'to-drink',
          ingles: 'To drink',
          espanol: 'Tomar',
          tipo: TipoEntrada.VERBO,
          modulo: { numero: 1, nombre: 'Level I', tramo: TramoModulo.BASICO },
        },
      ],
    });
    vi.mocked(crearEntrada).mockResolvedValue(guardada('To drink'));
    const { user } = montar();

    await user.type(await screen.findByLabelText('Inglés'), 'To drink');
    await user.tab();

    expect(await screen.findByText('Puede ser un duplicado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver la entrada que ya existe' })).toHaveAttribute(
      'href',
      '/admin/diccionario/entrada/d1',
    );

    await user.type(screen.getByLabelText('Español'), 'Beber');
    await user.selectOptions(screen.getByLabelText('Módulo'), 'm2');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'c1');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(crearEntrada).toHaveBeenCalledTimes(1));
  });

  it('«Guardar y crear otra» conserva módulo, unidad y categoría', async () => {
    vi.mocked(crearEntrada).mockImplementation((input) => Promise.resolve(guardada(input.ingles)));
    const { user } = montar();

    await user.type(await screen.findByLabelText('Inglés'), 'To swim');
    await user.type(screen.getByLabelText('Español'), 'Nadar');
    await user.click(screen.getByRole('radio', { name: 'Verbo' }));
    await user.selectOptions(screen.getByLabelText('Módulo'), 'm2');
    await user.selectOptions(screen.getByLabelText('Unidad'), 'u21');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'c1');
    await user.click(screen.getByRole('button', { name: 'Guardar y crear otra' }));

    await waitFor(() =>
      expect(crearEntrada).toHaveBeenCalledWith({
        ingles: 'To swim',
        espanol: 'Nadar',
        tipo: TipoEntrada.VERBO,
        moduloId: 'm2',
        unidadId: 'u21',
        categoriaId: 'c1',
        nota: null,
        publicada: true,
      }),
    );
    expect(
      await screen.findByText('Entrada guardada · To swim ya se ve en el diccionario'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Inglés')).toHaveValue('');
    expect(screen.getByLabelText('Inglés')).toHaveFocus();
    expect(screen.getByLabelText('Módulo')).toHaveValue('m2');
    expect(screen.getByLabelText('Unidad')).toHaveValue('u21');
    expect(screen.getByLabelText('Categoría')).toHaveValue('c1');
  });

  it('pasa axe', async () => {
    const { container } = montar();
    await screen.findByLabelText('Inglés');
    await esperarSinFallosDeAccesibilidad(container);
  });
});
