import { useEffect, useState } from 'react';

import { confirmarVideo, pedirSubidaVideo, quitarVideo, subirArchivo } from '../api/medios';
import { capturarMiniatura } from '../lib/capturar-miniatura';
import { validarVideo } from '../lib/validar-video';
import { useSubida } from './use-subida';

type Opciones = {
  validar?: typeof validarVideo;
  capturar?: typeof capturarMiniatura;
};

/** Valida en el navegador, captura la miniatura, sube video y miniatura y confirma. */
export function useSubirSena(entradaId: string, opciones: Opciones = {}) {
  const { validar = validarVideo, capturar = capturarMiniatura } = opciones;
  const subida = useSubida();
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    },
    [vistaPrevia],
  );

  async function subir(archivo: File) {
    const resultado = await validar(archivo);
    if (!resultado.ok) return subida.rechazar(resultado.motivo);

    const ok = await subida.ejecutar(async ({ senal, empezar, avanzar, procesando }) => {
      const miniatura = await capturar(resultado.video);
      empezar(archivo.size + miniatura.size);
      const destino = await pedirSubidaVideo(entradaId, {
        tipo: 'video/mp4',
        bytes: archivo.size,
        duracionMs: resultado.duracionMs,
        miniaturaTipo: 'image/jpeg',
      });
      let deVideo = 0;
      let deMiniatura = 0;
      await Promise.all([
        subirArchivo(destino.video, archivo, (b) => avanzar((deVideo = b) + deMiniatura), senal),
        subirArchivo(
          destino.miniatura,
          miniatura,
          (b) => avanzar(deVideo + (deMiniatura = b)),
          senal,
        ),
      ]);
      procesando();
      await confirmarVideo(entradaId, destino.videoId);
    });
    if (ok) setVistaPrevia(URL.createObjectURL(archivo));
  }

  async function quitar() {
    await quitarVideo(entradaId);
    setVistaPrevia(null);
    subida.reiniciar();
    await subida.refrescar();
  }

  return { ...subida, subir, quitar, vistaPrevia };
}
