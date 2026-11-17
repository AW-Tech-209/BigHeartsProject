const ANCHO_MINIATURA = 720;
const MOMENTO = 0.4;

function aBlob(canvas: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolver) => canvas.toBlob(resolver, tipo, calidad));
}

/** Fotograma al 40 % de la duración, JPEG de 720 px de ancho: el servidor no genera miniaturas. */
export async function capturarMiniatura(video: HTMLVideoElement): Promise<Blob> {
  await new Promise<void>((resolver, rechazar) => {
    video.onseeked = () => resolver();
    video.onerror = () => rechazar(new Error('No pudimos leer el video para su miniatura.'));
    video.currentTime = video.duration * MOMENTO;
  });

  const escala = ANCHO_MINIATURA / video.videoWidth;
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO_MINIATURA;
  canvas.height = Math.round(video.videoHeight * escala);
  canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await aBlob(canvas, 'image/jpeg', 0.85);
  if (!blob) throw new Error('No pudimos crear la miniatura del video.');
  return blob;
}
