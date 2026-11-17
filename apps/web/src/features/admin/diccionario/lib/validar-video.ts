import { LIMITES_MEDIOS_POR_DEFECTO } from '@academia/types';

export type Metadatos = { duracionS: number; ancho: number; video: HTMLVideoElement };

export type ResultadoValidacion =
  { ok: true; duracionMs: number; video: HTMLVideoElement } | { ok: false; motivo: string };

export const NO_REPRODUCIBLE =
  'Este video no se puede reproducir en todos los navegadores. Expórtalo en MP4 (H.264).';

const MB = 1024 * 1024;
const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

export function formatoMb(bytes: number): string {
  return `${numero.format(bytes / MB)} MB`;
}

const segundos = (n: number) => `${n} ${n === 1 ? 'segundo' : 'segundos'}`;

/** Carga el archivo en un `<video>` oculto y espera `loadedmetadata`; rechaza si no se puede leer. */
export function cargarMetadatos(archivo: File): Promise<Metadatos> {
  return new Promise((resolver, rechazar) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () =>
      resolver({ duracionS: video.duration, ancho: video.videoWidth, video });
    video.onerror = () => rechazar(new Error(NO_REPRODUCIBLE));
    video.src = URL.createObjectURL(archivo);
  });
}

/** El navegador hace lo que el servidor no hace: solo MP4 reproducible, de 2 a 15 s y ≤ 20 MB. */
export async function validarVideo(
  archivo: File,
  limites = LIMITES_MEDIOS_POR_DEFECTO,
  cargar: (archivo: File) => Promise<Metadatos> = cargarMetadatos,
): Promise<ResultadoValidacion> {
  if (archivo.type !== 'video/mp4') {
    return {
      ok: false,
      motivo: 'Solo se aceptan videos MP4. Expórtalo en MP4 (H.264) y vuelve a intentarlo.',
    };
  }
  if (archivo.size > limites.videoMaxMb * MB) {
    return {
      ok: false,
      motivo: `Pesa ${formatoMb(archivo.size)}. El máximo es ${limites.videoMaxMb} MB.`,
    };
  }

  let metadatos: Metadatos;
  try {
    metadatos = await cargar(archivo);
  } catch {
    return { ok: false, motivo: NO_REPRODUCIBLE };
  }
  if (!(metadatos.ancho > 0) || !Number.isFinite(metadatos.duracionS)) {
    return { ok: false, motivo: NO_REPRODUCIBLE };
  }

  const duracion = Math.round(metadatos.duracionS);
  if (metadatos.duracionS > limites.videoMaxS) {
    return { ok: false, motivo: `Dura ${segundos(duracion)}. El máximo es ${limites.videoMaxS}.` };
  }
  if (metadatos.duracionS < limites.videoMinS) {
    return { ok: false, motivo: `Dura ${segundos(duracion)}. El mínimo es ${limites.videoMinS}.` };
  }
  return { ok: true, duracionMs: Math.round(metadatos.duracionS * 1000), video: metadatos.video };
}
