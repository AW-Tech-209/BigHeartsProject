import { confirmarVideo, pedirSubidaVideo, subirArchivo } from '../api/medios';
import { capturarMiniatura } from './capturar-miniatura';

type SubirSenaParams = {
  entradaId: string;
  archivo: File;
  /** Lo que devolvió `validarVideo`: el video ya cargado y su duración. */
  validado: { duracionMs: number; video: HTMLVideoElement };
  senal: AbortSignal;
  alEmpezar: (totalBytes: number) => void;
  alAvanzar: (subidos: number) => void;
  alProcesar: () => void;
  capturar?: typeof capturarMiniatura;
};

/** Captura la miniatura, pide las URLs, sube video y miniatura en paralelo y confirma. */
export async function subirSena({
  entradaId,
  archivo,
  validado,
  senal,
  alEmpezar,
  alAvanzar,
  alProcesar,
  capturar = capturarMiniatura,
}: SubirSenaParams): Promise<void> {
  const miniatura = await capturar(validado.video);
  alEmpezar(archivo.size + miniatura.size);
  const destino = await pedirSubidaVideo(entradaId, {
    tipo: 'video/mp4',
    bytes: archivo.size,
    duracionMs: validado.duracionMs,
    miniaturaTipo: 'image/jpeg',
  });
  let deVideo = 0;
  let deMiniatura = 0;
  await Promise.all([
    subirArchivo(destino.video, archivo, (b) => alAvanzar((deVideo = b) + deMiniatura), senal),
    subirArchivo(
      destino.miniatura,
      miniatura,
      (b) => alAvanzar(deVideo + (deMiniatura = b)),
      senal,
    ),
  ]);
  if (senal.aborted) throw new DOMException('Subida cancelada', 'AbortError');
  alProcesar();
  await confirmarVideo(entradaId, destino.videoId);
}
