import { describe, expect, it } from 'vitest';

import { ColaSubida, type SubirFila } from './cola-subida';

const video = document.createElement('video');
const validar = () => Promise.resolve({ ok: true as const, duracionMs: 5000, video });
const archivo = (n: number) => new File(['x'], `video-${n}.mp4`, { type: 'video/mp4' });
const esperar = () => new Promise((r) => setTimeout(r, 0));

function crearCola() {
  let simultaneas = 0;
  let maximo = 0;
  const pendientes: (() => void)[] = [];
  const subir: SubirFila = () => {
    simultaneas++;
    maximo = Math.max(maximo, simultaneas);
    return new Promise<void>((resolver) =>
      pendientes.push(() => {
        simultaneas--;
        resolver();
      }),
    );
  };
  const cola = new ColaSubida<null>({ validar, subir });
  return { cola, pendientes, maximo: () => maximo };
}

describe('ColaSubida', () => {
  it('nunca sube más de 2 a la vez y las filas no cambian de orden', async () => {
    const { cola, pendientes, maximo } = crearCola();
    cola.agregar(
      Array.from({ length: 6 }, (_, i) => ({
        archivo: archivo(i),
        entradaId: `e${i}`,
        meta: null,
      })),
    );
    const orden = cola.obtener().map((f) => f.archivo.name);

    for (let vuelta = 0; vuelta < 6; vuelta++) {
      await esperar();
      expect(cola.subiendoAhora()).toBeLessThanOrEqual(2);
      pendientes.shift()?.();
    }
    await esperar();

    expect(maximo()).toBe(2);
    expect(cola.obtener().map((f) => f.archivo.name)).toEqual(orden);
    expect(cola.obtener().every((f) => f.estado === 'lista')).toBe(true);
  });

  it('lo que no tiene entrada espera sin bloquear a los demás, y sube al asignarla', async () => {
    const { cola, pendientes } = crearCola();
    cola.agregar([
      { archivo: archivo(1), entradaId: null, meta: null },
      { archivo: archivo(2), entradaId: 'e2', meta: null },
    ]);
    await esperar();

    expect(cola.obtener().map((f) => f.estado)).toEqual(['sin-entrada', 'subiendo']);
    cola.asignar(1, 'e1');
    expect(cola.obtener()[0]?.estado).toBe('subiendo');
    pendientes.forEach((p) => p());
  });

  it('en pausa no empieza ninguna nueva', async () => {
    const { cola } = crearCola();
    cola.pausar();
    cola.agregar([{ archivo: archivo(1), entradaId: 'e1', meta: null }]);
    await esperar();

    expect(cola.obtener()[0]?.estado).toBe('en-espera');
    cola.reanudar();
    expect(cola.obtener()[0]?.estado).toBe('subiendo');
  });
});
