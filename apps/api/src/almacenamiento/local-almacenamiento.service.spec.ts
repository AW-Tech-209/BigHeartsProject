import { describe, expect, it } from 'vitest';

import { LocalAlmacenamientoService } from './local-almacenamiento.service';

const CLAVE =
  'videos/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.mp4';
const local = new LocalAlmacenamientoService('secreto', 'http://localhost:3000', '/tmp/medios');
const tokenDe = (url: string) => new URL(url).searchParams.get('t') ?? '';

describe('LocalAlmacenamientoService — URLs firmadas', () => {
  it('la URL de lectura da acceso solo a esa clave y solo para leer', async () => {
    const urls = await local.urlsDeLectura([CLAVE], 60);
    const token = tokenDe(urls.get(CLAVE) ?? '');

    expect(local.verificar(token, 'leer')?.clave).toBe(CLAVE);
    expect(local.verificar(token, 'subir')).toBeNull();
  });

  it('rechaza un token manipulado, de otro secreto o caducado', async () => {
    const token = tokenDe((await local.urlsDeLectura([CLAVE], 60)).get(CLAVE) ?? '');
    const otro = new LocalAlmacenamientoService(
      'otro-secreto',
      'http://localhost:3000',
      '/tmp/medios',
    );
    const caducado = tokenDe((await local.urlsDeLectura([CLAVE], -1)).get(CLAVE) ?? '');

    expect(local.verificar(`${token}x`, 'leer')).toBeNull();
    expect(otro.verificar(token, 'leer')).toBeNull();
    expect(local.verificar(caducado, 'leer')).toBeNull();
  });

  it('no deja salir de la carpeta de almacenamiento', () => {
    expect(() => local.ruta('../../etc/passwd')).toThrow();
    expect(() => local.ruta('videos/x/../../secreto.mp4')).toThrow();
  });
});
