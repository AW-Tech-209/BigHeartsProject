import { describe, expect, it } from 'vitest';

import { claveDeNombre, emparejarArchivos, type EntradaEmparejable } from './emparejar-archivos';

const entrada = (id: string, ingles: string, modulo = 1, conSena = false): EntradaEmparejable => ({
  id,
  slug: id,
  ingles,
  modulo: { numero: modulo },
  conSena,
});

const ENTRADAS = [
  entrada('to-eat', 'To eat'),
  entrada('to-wash', 'To wash'),
  entrada('to-drink', 'To drink', 1, true),
  entrada('cafe', 'Café'),
  entrada('house', 'House', 1),
  entrada('house-2', 'House', 3),
];

describe('emparejarArchivos', () => {
  it('normaliza el nombre: sin extensión, mayúsculas, tildes ni separadores', () => {
    expect(claveDeNombre('To_Eat.MP4')).toBe('to eat');
    expect(claveDeNombre('to-eat.mp4')).toBe('to eat');
    expect(claveDeNombre('Cafe.mp4')).toBe(claveDeNombre('Café'));
  });

  it('empareja to-eat.mp4 y To_Eat.MP4 con «To eat»', () => {
    const [a, b] = emparejarArchivos(['to-eat.mp4', 'To_Eat.MP4'], ENTRADAS);
    expect(a).toEqual({ estado: 'emparejada', entrada: ENTRADAS[0] });
    expect(b).toEqual({ estado: 'emparejada', entrada: ENTRADAS[0] });
  });

  it('to-wach.mp4 queda sin emparejar con la sugerencia «To wash»', () => {
    expect(emparejarArchivos(['to-wach.mp4'], ENTRADAS)).toEqual([
      { estado: 'sin-emparejar', sugerencia: ENTRADAS[1] },
    ]);
  });

  it('IMG_2041.mp4 queda sin emparejar y sin sugerencia', () => {
    expect(emparejarArchivos(['IMG_2041.mp4'], ENTRADAS)).toEqual([
      { estado: 'sin-emparejar', sugerencia: null },
    ]);
  });

  it('un nombre repetido en dos módulos es ambiguo, salvo que el archivo traiga el slug', () => {
    const [ambiguo, porSlug] = emparejarArchivos(['house.mp4', 'house-2.mp4'], ENTRADAS);
    expect(ambiguo).toEqual({ estado: 'ambigua', candidatas: [ENTRADAS[4], ENTRADAS[5]] });
    expect(porSlug).toEqual({ estado: 'emparejada', entrada: ENTRADAS[5] });
  });

  it('si la entrada ya tiene seña lista, avisa que la reemplaza', () => {
    expect(emparejarArchivos(['to-drink.mp4'], ENTRADAS)).toEqual([
      { estado: 'reemplaza', entrada: ENTRADAS[2] },
    ]);
  });
});
