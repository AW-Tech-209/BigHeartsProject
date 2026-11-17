import { EstadoModulo, TramoModulo, UserRole } from '@academia/types';
import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import {
  getCategoriasAdmin,
  getModulosAdmin,
} from '@/features/admin/diccionario/api/admin-diccionario';
import {
  eliminarCategoria,
  reordenarCategorias,
  reordenarUnidades,
} from '@/features/admin/diccionario/api/estructura';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/admin/diccionario/api/admin-diccionario', () => ({
  getModulosAdmin: vi.fn(),
  getCategoriasAdmin: vi.fn(),
}));
vi.mock('@/features/admin/diccionario/api/estructura', () => ({
  editarModulo: vi.fn(),
  crearUnidad: vi.fn(),
  editarUnidad: vi.fn(),
  reordenarUnidades: vi.fn(),
  eliminarUnidad: vi.fn(),
  crearCategoria: vi.fn(),
  editarCategoria: vi.fn(),
  reordenarCategorias: vi.fn(),
  eliminarCategoria: vi.fn(),
}));

const categoria = (id: string, nombre: string, palabras: number, orden: number) => ({
  id,
  slug: id,
  nombre,
  icono: 'shirt',
  descripcion: null,
  orden,
  palabras,
});

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.ADMIN);
  vi.mocked(getModulosAdmin).mockResolvedValue({
    modulos: [
      {
        id: 'm1',
        numero: 1,
        nombre: 'Level I',
        tramo: TramoModulo.BASICO,
        estado: EstadoModulo.DISPONIBLE,
        orden: 1,
        palabras: 203,
        unidades: [
          { id: 'u1', codigo: 'U1', nombre: 'Need, Want', orden: 1, palabras: 24 },
          { id: 'u2', codigo: 'U2', nombre: 'What, Where, When', orden: 2, palabras: 39 },
        ],
      },
    ],
  });
  vi.mocked(getCategoriasAdmin).mockResolvedValue({
    categorias: [
      categoria('objetos', 'Objetos', 28, 1),
      categoria('ropa', 'Ropa', 3, 2),
      categoria('vacia', 'Vacía', 0, 3),
    ],
  });
  vi.mocked(reordenarUnidades).mockResolvedValue(undefined);
  vi.mocked(reordenarCategorias).mockResolvedValue(undefined);
  vi.mocked(eliminarCategoria).mockResolvedValue(undefined);
});

function montar() {
  return renderConProviders(<AppRoutes />, { ruta: '/admin/diccionario/estructura' });
}

describe('AdminEstructuraPage', () => {
  it('reordenar con teclado manda el orden nuevo', async () => {
    const { user } = montar();
    const bajar = await screen.findByRole('button', { name: 'Bajar Unidad 1' });

    bajar.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(reordenarUnidades).toHaveBeenCalledWith('m1', ['u2', 'u1']));
    // Tras guardar, el foco vuelve al botón que se pulsó; hay que esperarlo antes de seguir.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Bajar Unidad 1' })).toHaveFocus(),
    );

    const subirRopa = screen.getByRole('button', { name: 'Subir Ropa' });
    subirRopa.focus();
    expect(subirRopa).toHaveFocus();
    await user.keyboard(' ');
    await waitFor(() =>
      expect(reordenarCategorias).toHaveBeenCalledWith(['ropa', 'objetos', 'vacia']),
    );
  });

  it('no deja eliminar una categoría con entradas hasta escribir su nombre exacto', async () => {
    const { user } = montar();
    await user.click(await screen.findByRole('button', { name: 'Eliminar la categoría Ropa' }));
    const dialogo = await screen.findByRole('alertdialog', {
      name: 'Eliminar la categoría «Ropa»',
    });

    expect(within(dialogo).getByRole('button', { name: 'Volver' })).toHaveFocus();
    await user.selectOptions(within(dialogo).getByLabelText('Categoría de destino'), 'objetos');
    const eliminar = within(dialogo).getByRole('button', { name: /Eliminar y mover 3 entradas/ });
    await user.type(within(dialogo).getByLabelText(/Para confirmar, escribe/), 'rop');
    await user.click(eliminar);

    expect(eliminar).toHaveAttribute('aria-disabled', 'true');
    expect(eliminarCategoria).not.toHaveBeenCalled();

    await user.type(
      within(dialogo).getByLabelText(/Para confirmar, escribe/),
      '{Backspace}{Backspace}{Backspace}Ropa',
    );
    await user.click(eliminar);
    await waitFor(() =>
      expect(eliminarCategoria).toHaveBeenCalledWith('ropa', {
        destino: 'mover',
        haciaId: 'objetos',
      }),
    );
  });

  it('sin entradas, eliminar pide solo confirmación', async () => {
    const { user } = montar();
    await user.click(await screen.findByRole('button', { name: 'Eliminar la categoría Vacía' }));
    const dialogo = await screen.findByRole('alertdialog');

    expect(
      within(dialogo).getByText('No tiene entradas. Se puede eliminar sin mover nada.'),
    ).toBeInTheDocument();
    expect(within(dialogo).queryByLabelText(/Para confirmar, escribe/)).not.toBeInTheDocument();
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(eliminarCategoria).toHaveBeenCalledWith('vacia', {}));
  });

  it('pasa axe', async () => {
    const { container } = montar();
    await screen.findByRole('button', { name: 'Bajar Unidad 1' });
    await esperarSinFallosDeAccesibilidad(container);
  });
});
