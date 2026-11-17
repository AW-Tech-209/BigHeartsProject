import {
  type BusquedaResponse,
  EstadoModulo,
  type ModuloResumen,
  TipoEntrada,
  TramoModulo,
  UserRole,
} from '@academia/types';
import { screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buscarEnDiccionario, getDiccionarioInicio } from '@/features/diccionario/api/diccionario';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { DiccionarioPage } from './DiccionarioPage';

vi.mock('@/features/diccionario/api/diccionario', () => ({
  getDiccionarioInicio: vi.fn(),
  buscarEnDiccionario: vi.fn(),
}));

const TRAMO_DE = (n: number) =>
  n <= 3 ? TramoModulo.BASICO : n <= 6 ? TramoModulo.INTERMEDIO : TramoModulo.AVANZADO;

const MODULOS: ModuloResumen[] = Array.from({ length: 9 }, (_, i) => {
  const numero = i + 1;
  const disponible = numero <= 3;
  return {
    numero,
    nombre: `Level ${numero}`,
    tramo: TRAMO_DE(numero),
    estado: disponible ? EstadoModulo.DISPONIBLE : EstadoModulo.PROXIMAMENTE,
    palabras: disponible ? 100 : 0,
    conSena: disponible ? 10 : 0,
  };
});

const TO_EAT: BusquedaResponse = {
  q: 'comer',
  resultados: [
    {
      slug: 'to-eat',
      ingles: 'To eat',
      espanol: 'Comer',
      tipo: TipoEntrada.VERBO,
      modulo: { numero: 1, nombre: 'Level I', tramo: TramoModulo.BASICO },
      categoria: { slug: 'acciones', nombre: 'Acciones', icono: 'activity' },
      sena: { estado: 'en-preparacion', url: null, miniaturaUrl: null },
    },
  ],
};

function montar(ruta = '/diccionario') {
  return renderConProviders(
    <Routes>
      <Route path="/diccionario" element={<DiccionarioPage />} />
      <Route path="/diccionario/entrada/:slug" element={<p>Entrada abierta</p>} />
    </Routes>,
    { ruta },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  darSesion(UserRole.STUDENT);
  vi.mocked(getDiccionarioInicio).mockResolvedValue({ modulos: MODULOS });
  vi.mocked(buscarEnDiccionario).mockResolvedValue(TO_EAT);
});

describe('DiccionarioPage — inicio', () => {
  it('un módulo próximo es un botón que explica por qué no está, y se abre con teclado', async () => {
    const { user } = montar();
    const boton = await screen.findByRole('button', { name: /Módulo\s*4/ });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /Módulo\s*4/ })).not.toBeInTheDocument();

    boton.focus();
    await user.keyboard('{Enter}');

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    const explicacion = within(
      document.getElementById(boton.getAttribute('aria-controls') ?? '') as HTMLElement,
    );
    expect(explicacion.getByText('Llegará cuando el profesor entregue el material.')).toBeVisible();
    expect(explicacion.getByRole('link', { name: 'Ir al Módulo 3' })).toHaveAttribute(
      'href',
      '/diccionario/modulo/3',
    );
  });

  it('cada tramo se nombra con texto, no solo con color', async () => {
    montar();
    for (const tramo of ['Básico', 'Intermedio', 'Avanzado']) {
      expect(await screen.findByRole('heading', { level: 2, name: tramo })).toBeInTheDocument();
    }
  });

  it('pasa axe', async () => {
    const { container } = montar();
    await screen.findByRole('link', { name: /Módulo\s*1/ });
    await esperarSinFallosDeAccesibilidad(container);
  });
});

describe('DiccionarioPage — buscador', () => {
  it('no pide nada con 1 letra y con 2 sí', async () => {
    const { user } = montar();
    const campo = await screen.findByRole('combobox', { name: 'Busca en inglés o en español' });

    await user.type(campo, 'c');
    await new Promise((r) => setTimeout(r, 250));
    expect(buscarEnDiccionario).not.toHaveBeenCalled();

    await user.type(campo, 'o');
    await waitFor(() => expect(buscarEnDiccionario).toHaveBeenCalledWith('co', undefined));
  });

  it('escribir «comer» y elegir la primera sugerencia con el teclado abre «To eat»', async () => {
    const { user } = montar();
    const campo = await screen.findByRole('combobox', { name: 'Busca en inglés o en español' });

    await user.type(campo, 'comer');
    await screen.findByRole('option', { name: /To eat/ });
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /To eat/ })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Entrada abierta')).toBeInTheDocument();
    expect(localStorage.getItem('bighearts:diccionario:recientes')).toContain('to-eat');
  });

  it('`/?q=` muestra la lista completa y pasa axe', async () => {
    const { container } = montar('/diccionario?q=comer');

    expect(await screen.findByRole('link', { name: /To eat/ })).toHaveAttribute(
      'href',
      '/diccionario/entrada/to-eat',
    );
    expect(screen.getByText('1 resultado')).toBeInTheDocument();
    await esperarSinFallosDeAccesibilidad(container);
  });

  it('sin resultados explica qué probar', async () => {
    vi.mocked(buscarEnDiccionario).mockResolvedValue({ q: 'sombrero', resultados: [] });
    montar('/diccionario?q=sombrero');

    expect(await screen.findByText('No encontramos “sombrero”.')).toBeInTheDocument();
    expect(screen.getByText('Prueba en inglés o en español.')).toBeInTheDocument();
  });
});
