import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { confirmarVideo, pedirSubidaVideo, subirArchivo } from '../api/medios';
import { validarVideo } from '../lib/validar-video';
import { useSubirSena } from './use-subir-sena';

vi.mock('../api/medios', () => ({
  pedirSubidaVideo: vi.fn(),
  confirmarVideo: vi.fn(),
  quitarVideo: vi.fn(),
  subirArchivo: vi.fn(),
}));

const MB = 1024 * 1024;
const video = document.createElement('video');
const conDuracion = (duracionS: number) => (archivo: File) =>
  validarVideo(archivo, undefined, () => Promise.resolve({ duracionS, ancho: 640, video }));
const capturar = () =>
  Promise.resolve(new Blob([new Uint8Array(200 * 1024)], { type: 'image/jpeg' }));

const mp4 = (mb: number) =>
  new File([new Uint8Array(mb * MB)], 'to-drink.mp4', { type: 'video/mp4' });

let anuncios: string[];

function Banco({ validar, archivo }: { validar?: typeof validarVideo; archivo: File }) {
  const sena = useSubirSena('e1', { validar, capturar });
  useEffect(() => {
    if (sena.anuncio) anuncios.push(sena.anuncio);
  }, [sena.anuncio]);
  return (
    <>
      <button onClick={() => void sena.subir(archivo)}>Subir</button>
      <p>Estado: {sena.estado}</p>
      <p>{sena.error}</p>
    </>
  );
}

function montar(archivo: File, validar?: typeof validarVideo) {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <Banco validar={validar} archivo={archivo} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  anuncios = [];
  vi.mocked(pedirSubidaVideo).mockResolvedValue({
    videoId: 'v1',
    video: { url: 'https://s/v', metodo: 'PUT', headers: {} },
    miniatura: { url: 'https://s/m', metodo: 'PUT', headers: {} },
  });
});

describe('useSubirSena', () => {
  it('rechaza un .mov con su causa sin llamar a la API', async () => {
    montar(new File(['x'], 'to-drink.mov', { type: 'video/quicktime' }));
    fireEvent.click(screen.getByRole('button', { name: 'Subir' }));

    expect(await screen.findByText(/Solo se aceptan videos MP4/)).toBeInTheDocument();
    expect(pedirSubidaVideo).not.toHaveBeenCalled();
  });

  it('rechaza un video de 18 s con su causa sin llamar a la API', async () => {
    montar(mp4(1), conDuracion(18));
    fireEvent.click(screen.getByRole('button', { name: 'Subir' }));

    expect(await screen.findByText('Dura 18 segundos. El máximo es 15.')).toBeInTheDocument();
    expect(pedirSubidaVideo).not.toHaveBeenCalled();
  });

  it('anuncia el progreso en MB por hitos y «Lista» solo llega tras confirmar', async () => {
    vi.mocked(subirArchivo).mockImplementation(async (_destino, cuerpo, avanzar) => {
      for (let i = 1; i <= 10; i++) {
        await new Promise((r) => setTimeout(r, 0));
        avanzar((cuerpo.size * i) / 10);
      }
    });
    let responder: () => void = () => {};
    vi.mocked(confirmarVideo).mockImplementation(
      () => new Promise((r) => (responder = () => r({ videoId: 'v1', estado: 'lista' }))),
    );
    montar(mp4(5), conDuracion(5));
    fireEvent.click(screen.getByRole('button', { name: 'Subir' }));
    await waitFor(() => expect(screen.getByText('Estado: procesando')).toBeInTheDocument());
    expect(screen.queryByText('Estado: lista')).not.toBeInTheDocument();

    act(() => responder());
    expect(await screen.findByText('Estado: lista')).toBeInTheDocument();

    const deProgreso = anuncios.filter((a) => a.includes('MB'));
    expect(deProgreso.length).toBeGreaterThan(1);
    expect(deProgreso.length).toBeLessThanOrEqual(5);
    expect(anuncios.join(' ')).not.toMatch(/%/);
    expect(deProgreso.every((a) => a.endsWith('de 5,2 MB subidos.'))).toBe(true);
  });
});
