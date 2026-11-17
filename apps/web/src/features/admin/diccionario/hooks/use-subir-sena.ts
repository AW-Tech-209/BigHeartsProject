import { useEffect, useState } from 'react';

import { quitarVideo } from '../api/medios';
import { capturarMiniatura } from '../lib/capturar-miniatura';
import { subirSena } from '../lib/subir-sena';
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

    const ok = await subida.ejecutar(({ senal, empezar, avanzar, procesando }) =>
      subirSena({
        entradaId,
        archivo,
        validado: resultado,
        senal,
        capturar,
        alEmpezar: empezar,
        alAvanzar: avanzar,
        alProcesar: procesando,
      }),
    );
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
