import { type EntradaDetalleResponse, TipoEntrada, TramoModulo, UserRole } from '@academia/types';
import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getEntrada } from '@/features/diccionario/api/diccionario';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { DiccionarioEntradaPage } from './DiccionarioEntradaPage';

vi.mock('@/features/diccionario/api/diccionario', () => ({
  getEntrada: vi.fn(),
  getDiccionarioInicio: vi.fn(),
  getModulo: vi.fn(),
  getCategoria: vi.fn(),
  buscarEnDiccionario: vi.fn(),
}));

const TO_DRINK: EntradaDetalleResponse = {
  slug: 'to-drink',
  ingles: 'To drink',
  espanol: 'Tomar, beber',
  tipo: TipoEntrada.VERBO,
  modulo: { numero: 1, nombre: 'Level I', tramo: TramoModulo.BASICO },
  unidad: { codigo: 'U1', nombre: 'Need, Want' },
  categoria: { slug: 'acciones', nombre: 'Acciones', icono: 'activity' },
  nota: null,
  imagenUrl: null,
  sena: { estado: 'lista', url: 'https://cdn/v.mp4', miniaturaUrl: 'https://cdn/m.jpg' },
  posicion: { actual: 2, total: 51 },
  anterior: { slug: 'to-eat', ingles: 'To eat', espanol: 'Comer' },
  siguiente: { slug: 'to-read', ingles: 'To read', espanol: 'Leer' },
};

const play = vi.fn(() => Promise.resolve());

function montar(slug = 'to-drink') {
  return renderConProviders(
    <Routes>
      <Route path="/diccionario/entrada/:slug" element={<DiccionarioEntradaPage />} />
    </Routes>,
    { ruta: `/diccionario/entrada/${slug}` },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  darSesion(UserRole.STUDENT);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.mocked(getEntrada).mockImplementation((slug) =>
    Promise.resolve(
      slug === 'to-read'
        ? {
            ...TO_DRINK,
            slug,
            ingles: 'To read',
            espanol: 'Leer',
            posicion: { actual: 3, total: 51 },
          }
        : TO_DRINK,
    ),
  );
});

afterEach(() => vi.restoreAllMocks());

describe('DiccionarioEntradaPage — reproductor', () => {
  it('no reproduce solo: el video no tiene autoplay y play() no se llama sin gesto', async () => {
    montar();
    const video = await screen.findByLabelText('Seña en LSC de To drink');

    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('preload', 'none');
    expect(play).not.toHaveBeenCalled();
    expect(
      screen.getByText('Lista para ver. No se reproduce sola. Se repite en bucle.'),
    ).toBeInTheDocument();
  });

  it('«Ver la seña» llama a play() y el foco pasa a «Pausa»', async () => {
    const { user } = montar();
    await user.click(await screen.findByRole('button', { name: 'Ver la seña de To drink' }));

    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Pausa' })).toHaveFocus();
  });

  it('a 0.75× con espejo: playbackRate 0.75, solo el video invertido y la línea lo dice', async () => {
    const { user } = montar();
    const video = (await screen.findByLabelText('Seña en LSC de To drink')) as HTMLVideoElement;

    await user.click(screen.getByRole('radio', { name: '0.75×' }));
    const espejo = screen.getByRole('switch', { name: 'Ver como en un espejo' });
    await user.click(espejo);
    await user.click(screen.getByRole('button', { name: 'Ver la seña de To drink' }));
    fireEvent.playing(video);

    expect(video.playbackRate).toBe(0.75);
    expect(espejo).toHaveAttribute('aria-checked', 'true');
    expect(video.className).toContain('-scale-x-100');
    expect(screen.getByRole('radiogroup', { name: 'Velocidad' }).className).not.toContain(
      'scale-x',
    );
    expect(screen.getByText(/Reproduciendo en bucle · Velocidad 0.75×/)).toBeInTheDocument();
  });

  it('→ navega a la siguiente entrada y el foco va a su <h1>', async () => {
    const { user } = montar();
    await screen.findByRole('heading', { level: 1, name: 'To drink' });

    await user.keyboard('{ArrowRight}');

    const h1 = await screen.findByRole('heading', { level: 1, name: 'To read' });
    expect(h1).toHaveFocus();
    expect(document.title).toContain('To read · Acciones · Diccionario');
  });

  it('pasa axe', async () => {
    const { container } = montar();
    await screen.findByRole('heading', { level: 1, name: 'To drink' });
    await esperarSinFallosDeAccesibilidad(container);
  });
});

describe('DiccionarioEntradaPage — sin seña', () => {
  it('muestra la ficha completa y el bloque de grabación, sin controles', async () => {
    vi.mocked(getEntrada).mockResolvedValue({
      ...TO_DRINK,
      sena: { estado: 'en-preparacion', url: null, miniaturaUrl: null },
    });
    const { container } = montar();

    expect(await screen.findByText('La seña de esta palabra se está grabando')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'To drink' })).toBeInTheDocument();
    expect(screen.getByText('Seña en preparación')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reproducir|Pausa/ })).not.toBeInTheDocument();
    expect(container.querySelector('video')).toBeNull();
    await esperarSinFallosDeAccesibilidad(container);
  });
});
