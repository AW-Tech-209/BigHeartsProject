import { LIMITES_MEDIOS_POR_DEFECTO } from '@academia/types';
import { useEffect, useState } from 'react';

import { confirmarImagen, pedirSubidaImagen, quitarImagen, subirArchivo } from '../api/medios';
import { IMAGENES_ACEPTADAS, reducirImagen } from '../lib/reducir-imagen';
import { useSubida } from './use-subida';

const KB = 1024;

/** Reduce a 800 px en WebP (o JPEG), comprueba el peso y sube con confirmación. */
export function useSubirImagen(entradaId: string, reducir: typeof reducirImagen = reducirImagen) {
  const subida = useSubida();
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    },
    [vistaPrevia],
  );

  async function subir(archivo: File) {
    if (!IMAGENES_ACEPTADAS.includes(archivo.type)) {
      return subida.rechazar('Solo se aceptan imágenes JPG, PNG o WebP.');
    }
    let reducida: Awaited<ReturnType<typeof reducirImagen>>;
    try {
      reducida = await reducir(archivo);
    } catch {
      return subida.rechazar('No pudimos leer esta imagen. Prueba con otra.');
    }
    const maximo = LIMITES_MEDIOS_POR_DEFECTO.imagenMaxKb * KB;
    if (reducida.blob.size > maximo) {
      return subida.rechazar(
        `Aun reducida pesa ${Math.round(reducida.blob.size / KB)} KB. El máximo es ${LIMITES_MEDIOS_POR_DEFECTO.imagenMaxKb} KB.`,
      );
    }

    const ok = await subida.ejecutar(async ({ senal, empezar, avanzar, procesando }) => {
      empezar(reducida.blob.size);
      const { clave, imagen } = await pedirSubidaImagen(entradaId, {
        tipo: reducida.tipo,
        bytes: reducida.blob.size,
      });
      await subirArchivo(imagen, reducida.blob, avanzar, senal);
      procesando();
      await confirmarImagen(entradaId, clave);
    });
    if (ok) setVistaPrevia(URL.createObjectURL(reducida.blob));
  }

  async function quitar() {
    await quitarImagen(entradaId);
    setVistaPrevia(null);
    subida.reiniciar();
    await subida.refrescar();
  }

  return { ...subida, subir, quitar, vistaPrevia };
}
