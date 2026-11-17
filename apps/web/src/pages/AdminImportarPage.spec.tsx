import { type FilaImportacion, UserRole } from '@academia/types';
import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import {
  confirmarImportacion,
  pedirVistaPrevia,
} from '@/features/admin/diccionario/api/importacion';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/admin/diccionario/api/importacion', () => ({
  pedirVistaPrevia: vi.fn(),
  confirmarImportacion: vi.fn(),
}));

const fila = (
  n: number,
  estado: FilaImportacion['estado'],
  motivo: string | null = null,
): FilaImportacion => ({
  fila: n,
  estado,
  motivo,
  modulo: estado === 'duplicada' ? '1' : '4',
  unidad: 'U1',
  categoria: 'Acciones',
  tipo: 'Verbo',
  ingles: `To import ${n}`,
  espanol: `Importar ${n}`,
  unidadNueva: n === 2,
});

const FILAS = [
  ...Array.from({ length: 12 }, (_, i) => fila(i + 2, 'nueva')),
  fila(14, 'duplicada', 'Ya existe en Módulo 1 · Unidad 1.'),
  fila(15, 'duplicada', 'Ya existe en Módulo 1 · Unidad 1.'),
  fila(16, 'error', 'La categoría “Comidas” no existe.'),
  fila(17, 'error', 'El tipo debe ser Palabra, Verbo, Frase o Expresión.'),
];

const csv = (nombre = 'modulo-4.csv') => new File(['modulo,unidad'], nombre, { type: 'text/csv' });

function montar() {
  const vista = renderConProviders(<AppRoutes />, { ruta: '/admin/diccionario/importar' });
  const selector = () =>
    vista.container.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement;
  return { ...vista, selector };
}

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.ADMIN);
  vi.mocked(pedirVistaPrevia).mockResolvedValue({
    token: 'tok-1',
    expiraEl: '2026-11-17T12:00:00.000Z',
    filas: FILAS,
    resumen: {
      total: 16,
      nuevas: 12,
      duplicadas: 2,
      errores: 2,
      unidadesNuevas: [{ modulo: 4, codigo: 'U1', nombre: 'Daily routines' }],
    },
  });
  vi.mocked(confirmarImportacion).mockResolvedValue({
    creadas: 12,
    actualizadas: 0,
    unidadesCreadas: 1,
  });
});

describe('AdminImportarPage', () => {
  it('el paso 2 muestra 12/2/2 con cada motivo y no importa nada', async () => {
    const { user, selector, container } = montar();
    await user.upload(selector(), csv());

    const titulo = await screen.findByRole('heading', {
      name: 'Paso 2 · Revisa lo que va a pasar',
    });
    expect(titulo).toHaveFocus();
    const resumen = screen.getByRole('list', { name: 'Resumen' });
    expect(within(resumen).getByText('12')).toBeInTheDocument();
    expect(within(resumen).getAllByText('2')).toHaveLength(2);
    expect(screen.getByText('La categoría “Comidas” no existe.')).toBeInTheDocument();
    expect(
      screen.getByText('El tipo debe ser Palabra, Verbo, Frase o Expresión.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Revisar');
    expect(confirmarImportacion).not.toHaveBeenCalled();
    await esperarSinFallosDeAccesibilidad(container);
  });

  it('el botón final dice el número exacto, importa y enlaza a la Cola de grabación', async () => {
    const { user, selector, container } = montar();
    await user.upload(selector(), csv());
    await user.click(await screen.findByRole('button', { name: /Seguir con 12 entradas/ }));

    expect(await screen.findByRole('heading', { name: 'Paso 3 · Confirma' })).toHaveFocus();
    expect(screen.getByText(/en el Módulo 4/)).toBeInTheDocument();
    await esperarSinFallosDeAccesibilidad(container);
    expect(confirmarImportacion).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Importar 12 entradas/ }));

    expect(confirmarImportacion).toHaveBeenCalledWith({ token: 'tok-1', incluirDuplicadas: false });
    expect(await screen.findByRole('heading', { name: 'Importación terminada' })).toHaveFocus();
    expect(screen.getByRole('link', { name: /Cola de grabación/ })).toHaveAttribute(
      'href',
      '/admin/diccionario/grabacion',
    );
    expect(screen.getByRole('link', { name: 'Ver en la consola' })).toHaveAttribute(
      'href',
      '/admin/diccionario?modulo=4',
    );
  });

  it('un archivo que no es CSV se rechaza con su causa sin llamar a la API', async () => {
    const { selector, container } = montar();
    fireEvent.change(selector(), { target: { files: [new File(['x'], 'lista.xlsx')] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('El archivo debe ser un CSV');
    expect(pedirVistaPrevia).not.toHaveBeenCalled();
    await esperarSinFallosDeAccesibilidad(container);
  });
});
