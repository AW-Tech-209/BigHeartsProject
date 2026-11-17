import type { TipoImagen } from '@academia/types';

const LADO_MAYOR = 800;

export const IMAGENES_ACEPTADAS = ['image/jpeg', 'image/png', 'image/webp'];

/** Lado mayor a 800 px; una imagen más pequeña nunca se agranda. */
export function medidasReducidas(ancho: number, alto: number): { ancho: number; alto: number } {
  const escala = Math.min(1, LADO_MAYOR / Math.max(ancho, alto));
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}

function aBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolver) => canvas.toBlob(resolver, tipo, 0.85));
}

/** WebP de 800 px de lado mayor; JPEG si el navegador no codifica WebP. */
export async function reducirImagen(archivo: File): Promise<{ blob: Blob; tipo: TipoImagen }> {
  const imagen = await createImageBitmap(archivo);
  const { ancho, alto } = medidasReducidas(imagen.width, imagen.height);
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  canvas.getContext('2d')?.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  const webp = await aBlob(canvas, 'image/webp');
  if (webp && webp.type === 'image/webp') return { blob: webp, tipo: 'image/webp' };
  const jpeg = await aBlob(canvas, 'image/jpeg');
  if (!jpeg) throw new Error('No pudimos preparar la imagen. Prueba con otra.');
  return { blob: jpeg, tipo: 'image/jpeg' };
}
