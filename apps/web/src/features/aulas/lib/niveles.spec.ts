import { describe, expect, it } from 'vitest';

import { duracionesDisponibles, duracionesHasta } from './niveles';

describe('duracionesHasta (HU-212, AC6)', () => {
  it('con el tope de fábrica ofrece la lista entera', () => {
    expect(duracionesHasta(240)).toEqual([...duracionesDisponibles]);
  });

  it('recorta las que superan el tope del servidor', () => {
    expect(duracionesHasta(60)).toEqual([30, 45, 60]);
  });

  it('deja la que dura exactamente el tope: 60 no son más de 60', () => {
    expect(duracionesHasta(60)).toContain(60);
  });

  /**
   * Un `<select>` vacío es un formulario que no se puede enviar y una pantalla
   * que no explica por qué. Ante un tope absurdo se prefiere ofrecer la
   * duración más corta y dejar que el servidor la rechace diciendo el motivo.
   */
  it('nunca devuelve una lista vacía, aunque el tope sea imposible', () => {
    expect(duracionesHasta(5)).toEqual([30]);
  });
});
