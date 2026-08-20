import { describe, expect, it } from 'vitest';

import { aInstanteISO, describirDuracion, describirHorario } from './horario';

/**
 * Estos tests corren en la zona del proceso, que NO es la misma en el portátil
 * de cada quien y en CI. Por eso comprueban propiedades que se cumplen en
 * cualquier zona —que el instante vuelve a leerse con la hora que se escribió,
 * que la zona aparece nombrada— en vez de una cadena literal que solo sería
 * cierta en Bogotá. Un test que solo pasa en una zona horaria es un test que
 * alguien va a desactivar el día que rompa en CI.
 */

describe('aInstanteISO', () => {
  it('combina día y hora en un instante ISO en UTC', () => {
    const iso = aInstanteISO({ fecha: '2027-08-12', hora: '18:00' });

    expect(iso).not.toBeNull();
    expect(iso).toMatch(/Z$/);
  });

  it('el instante conserva la hora local que eligió el profesor', () => {
    const iso = aInstanteISO({ fecha: '2027-08-12', hora: '18:30' });
    const leido = new Date(iso!);

    // Se lee de vuelta en la MISMA zona en que se escribió, que es la del
    // profesor: 18:30 para él sigue siendo 18:30, viaje como viaje por la red.
    expect(leido.getHours()).toBe(18);
    expect(leido.getMinutes()).toBe(30);
    expect(leido.getDate()).toBe(12);
  });

  /**
   * El caso que justifica que esta función exista. `new Date(2027, 1, 31)` no
   * falla: **desborda al 3 de marzo**. Sin la comprobación de vuelta, un
   * profesor que se equivoca de día publica la clase en otra fecha y la API
   * responde 201.
   */
  it('rechaza el 31 de febrero en vez de desbordarlo a marzo', () => {
    expect(aInstanteISO({ fecha: '2027-02-31', hora: '18:00' })).toBeNull();
  });

  it('rechaza campos vacíos o incompletos', () => {
    expect(aInstanteISO({ fecha: '', hora: '18:00' })).toBeNull();
    expect(aInstanteISO({ fecha: '2027-08-12', hora: '' })).toBeNull();
    expect(aInstanteISO({ fecha: '2027-08', hora: '18:00' })).toBeNull();
  });
});

describe('describirHorario', () => {
  const texto = describirHorario(aInstanteISO({ fecha: '2027-08-12', hora: '18:00' })!);

  it('nombra el día de la semana, el día, el mes y el año', () => {
    expect(texto).toMatch(/jueves/i);
    expect(texto).toContain('12');
    expect(texto).toMatch(/agosto/i);
    expect(texto).toContain('2027');
  });

  /**
   * El microcopy pide `6:00 p. m.`, no `18:00`. El locale `es` formatea en 24
   * horas por defecto, así que sin `hour12` explícito esto se rompe en silencio.
   */
  it('escribe la hora en formato de 12 horas', () => {
    expect(texto).toMatch(/6:00/);
    expect(texto).toMatch(/p\.?\s?m\.?/i);
  });

  it('empieza en mayúscula', () => {
    expect(texto[0]).toBe(texto[0]?.toUpperCase());
  });

  /**
   * La regla que no se negocia: **la zona va siempre**. Una hora sin zona es la
   * forma más barata de que un estudiante llegue una hora tarde a su clase.
   */
  it('nombra la zona horaria entre paréntesis', () => {
    expect(texto).toMatch(/\(.+\)$/);
    expect(texto).toMatch(/hora/i);
  });

  it('no imprime «Invalid Date» ante una fecha rota', () => {
    expect(describirHorario('no-es-una-fecha')).toBe('Fecha no disponible');
  });
});

describe('describirDuracion', () => {
  it.each([
    [30, '30 minutos'],
    [45, '45 minutos'],
    [60, '1 hora'],
    [90, '1 hora 30 minutos'],
    [120, '2 horas'],
    [1, '1 minuto'],
  ])('%i minutos → %s', (minutos, esperado) => {
    expect(describirDuracion(minutos)).toBe(esperado);
  });
});
