import {
  type CategoriaDetalleResponse,
  EstadoModulo,
  type ModuloDetalleResponse,
  TipoEntrada,
  TramoModulo,
  UserRole,
} from '@academia/types';
import { screen, waitFor, within } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCategoria,
  getDiccionarioInicio,
  getModulo,
} from '@/features/diccionario/api/diccionario';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { DiccionarioCategoriaPage } from './DiccionarioCategoriaPage';
import { DiccionarioModuloPage } from './DiccionarioModuloPage';

vi.mock('@/features/diccionario/api/diccionario', () => ({
  getDiccionarioInicio: vi.fn(),
  getModulo: vi.fn(),
  getCategoria: vi.fn(),
  buscarEnDiccionario: vi.fn(),
}));

const MODULO = { numero: 1, nombre: 'Level I', tramo: TramoModulo.BASICO };
const U1 = { codigo: 'U1', nombre: 'Need, Want' };

const entrada = (slug: string, ingles: string, lista: boolean) => ({
  slug,
  ingles,
  espanol: ingles,
  tipo: TipoEntrada.VERBO,
  unidad: U1,
  sena: lista
    ? { estado: 'lista' as const, url: 'https://x/v.mp4', miniaturaUrl: 'https://x/m.jpg' }
    : { estado: 'en-preparacion' as const, url: null, miniaturaUrl: null },
});

const ACCIONES: CategoriaDetalleResponse = {
  modulo: MODULO,
  categoria: { slug: 'acciones', nombre: 'Acciones', icono: 'activity', descripcion: null },
  entradas: [entrada('to-eat', 'To eat', false), entrada('to-drink', 'To drink', true)],
  filtros: {
    tipos: { [TipoEntrada.VERBO]: 51 },
    unidades: [
      { ...U1, palabras: 16 },
      { codigo: 'U3', nombre: 'Wish', palabras: 15 },
    ],
    conSena: 24,
    total: 51,
  },
};

const MODULO_1: ModuloDetalleResponse = {
  modulo: { ...MODULO, estado: EstadoModulo.DISPONIBLE, palabras: 203, conSena: 86 },
  unidad: null,
  unidades: [{ ...U1, palabras: 24 }],
  categorias: [
    { slug: 'acciones', nombre: 'Acciones', icono: 'activity', descripcion: null, palabras: 51 },
  ],
};

function Ubicacion() {
  const { pathname, search } = useLocation();
  return <output aria-label="Ubicación">{pathname + search}</output>;
}

function montar(ruta: string) {
  return renderConProviders(
    <>
      <Routes>
        <Route path="/diccionario/modulo/:numero" element={<DiccionarioModuloPage />} />
        <Route
          path="/diccionario/modulo/:numero/:categoria"
          element={<DiccionarioCategoriaPage />}
        />
        <Route path="*" element={null} />
      </Routes>
      <Ubicacion />
    </>,
    { ruta },
  );
}

const ubicacion = () => screen.getByRole('status', { name: 'Ubicación' }).textContent;

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.STUDENT);
  vi.mocked(getCategoria).mockResolvedValue(ACCIONES);
  vi.mocked(getModulo).mockResolvedValue(MODULO_1);
  vi.mocked(getDiccionarioInicio).mockResolvedValue({ modulos: [] });
});

describe('DiccionarioCategoriaPage', () => {
  it('los chips reflejan la URL y la cambian', async () => {
    const { user } = montar('/diccionario/modulo/1/acciones?unidad=u1');

    const u1 = await screen.findByRole(
      'button',
      { name: /Unidad 1 · Need, Want/ },
      { timeout: 3000 },
    );
    expect(u1).toHaveAttribute('aria-pressed', 'true');
    expect(getCategoria).toHaveBeenCalledWith(1, 'acciones', { unidad: 'U1' });

    await user.click(screen.getByRole('button', { name: /Unidad 3 · Wish/ }));
    expect(ubicacion()).toBe('/diccionario/modulo/1/acciones?unidad=U3');
  });

  it('«Solo con seña» pasa a la URL y filtra en el servidor', async () => {
    const { user } = montar('/diccionario/modulo/1/acciones');

    await user.click(await screen.findByRole('switch', { name: /Solo con seña/ }));

    expect(ubicacion()).toBe('/diccionario/modulo/1/acciones?conSena=true');
    await waitFor(() =>
      expect(getCategoria).toHaveBeenLastCalledWith(1, 'acciones', { conSena: true }),
    );
  });

  it('solo hay chip para los tipos que existen', async () => {
    montar('/diccionario/modulo/1/acciones');

    expect(await screen.findByRole('button', { name: /Verbo\s*51/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Palabra/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Frase/ })).not.toBeInTheDocument();
  });

  it('una palabra sin seña dice «Seña en preparación» y sigue llevando a su entrada', async () => {
    montar('/diccionario/modulo/1/acciones');

    const tarjeta = await screen.findByRole('link', { name: /To eat/ });
    expect(tarjeta).toHaveTextContent('Seña en preparación');
    expect(tarjeta).toHaveAttribute('href', '/diccionario/entrada/to-eat');
    expect(screen.queryByRole('video')).not.toBeInTheDocument();
    expect(document.querySelector('video')).toBeNull();
  });

  it('«Practicar» no hace nada y dice por qué', async () => {
    montar('/diccionario/modulo/1/acciones');

    const boton = await screen.findByRole('button', { name: 'Practicar Acciones' });
    expect(boton).toHaveAttribute('aria-disabled', 'true');
    expect(boton).toHaveAccessibleDescription(/Llegará en una próxima versión/);
  });

  it('pasa axe', async () => {
    const { container } = montar('/diccionario/modulo/1/acciones');
    await screen.findByRole('link', { name: /To eat/ });
    await esperarSinFallosDeAccesibilidad(container);
  });
});

describe('DiccionarioModuloPage', () => {
  it('lleva a la categoría con migas de vuelta, y la unidad viaja en la URL', async () => {
    const { user } = montar('/diccionario/modulo/1');

    expect(await screen.findByRole('link', { name: /Acciones/ })).toHaveAttribute(
      'href',
      '/diccionario/modulo/1/acciones',
    );
    const migas = screen.getByRole('navigation', { name: 'Migas de pan' });
    expect(within(migas).getByRole('link', { name: 'Diccionario' })).toHaveAttribute(
      'href',
      '/diccionario',
    );

    await user.click(screen.getByRole('button', { name: /Unidad 1 · Need, Want/ }));
    expect(ubicacion()).toBe('/diccionario/modulo/1?unidad=U1');
  });

  it('pasa axe', async () => {
    const { container } = montar('/diccionario/modulo/1');
    await screen.findByRole('link', { name: /Acciones/ });
    await esperarSinFallosDeAccesibilidad(container);
  });
});
