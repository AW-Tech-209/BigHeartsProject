import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from '@/components/ui/badge';
import { renderConProviders } from '@/test/render-con-providers';
import { ESTADOS_SOLIDOS, varianteEstadoAula, type EstadoAula } from './estado-aula-variantes';

/**
 * La regla del sólido, recorrida estado por estado.
 *
 * Existe este test —y no uno sobre `<EstadoAula>`, que nace en HU-203— porque
 * la regla es una decisión de producto que tiene que poder romperse
 * ruidosamente antes de que exista el componente que la obedece. El fallo que
 * vigila es concreto y fácil de cometer: alguien quiere destacar
 * `ultimos-cupos`, lo sube a sólido, y a partir de ahí hay dos cosas gritando
 * en la misma pantalla, con lo que ninguna grita.
 *
 * La tabla de fondos está **transcrita a mano** desde `patrones-dominio.md`, no
 * derivada del código: si se calculara a partir de `varianteEstadoAula`, el
 * test pasaría siempre y no comprobaría nada.
 */

const TODOS_LOS_ESTADOS = Object.keys(varianteEstadoAula) as EstadoAula[];

const FONDO_ESPERADO: Record<EstadoAula, string> = {
  disponible: 'bg-success-soft',
  'ultimos-cupos': 'bg-attention-soft',
  llena: 'bg-muted',
  reservada: 'bg-primary-soft',
  'acceso-abierto': 'bg-attention',
  'en-curso': 'bg-success',
  finalizada: 'bg-muted',
  cancelada: 'bg-destructive-soft',
  'pendiente-aprobacion': 'bg-attention-soft',
};

describe('varianteEstadoAula — la regla del sólido', () => {
  it('cubre los nueve estados del diccionario, ni uno más ni uno menos', () => {
    expect(TODOS_LOS_ESTADOS).toHaveLength(9);
    expect(TODOS_LOS_ESTADOS.sort()).toEqual(
      [
        'disponible',
        'ultimos-cupos',
        'llena',
        'reservada',
        'acceso-abierto',
        'en-curso',
        'finalizada',
        'cancelada',
        'pendiente-aprobacion',
      ].sort(),
    );
  });

  it.each(TODOS_LOS_ESTADOS)('«%s» usa color pleno solo si le corresponde', (estado) => {
    const debeSerSolido = ESTADOS_SOLIDOS.includes(estado);

    expect(varianteEstadoAula[estado].enfasis).toBe(debeSerSolido ? 'solido' : 'suave');
  });

  it('los únicos dos estados sólidos son «acceso-abierto» y «en-curso»', () => {
    const solidos = TODOS_LOS_ESTADOS.filter(
      (estado) => varianteEstadoAula[estado].enfasis === 'solido',
    );

    expect(solidos.sort()).toEqual(['acceso-abierto', 'en-curso']);
  });

  it('los otros siete van en variante suave', () => {
    const suaves = TODOS_LOS_ESTADOS.filter(
      (estado) => varianteEstadoAula[estado].enfasis === 'suave',
    );

    expect(suaves).toHaveLength(7);
  });
});

describe('varianteEstadoAula — cómo se pinta cada estado', () => {
  /** Pinta un estado con la primitiva real y devuelve el nodo resultante. */
  function pintar(estado: EstadoAula) {
    const { tono, enfasis, icon } = varianteEstadoAula[estado];

    renderConProviders(
      <Badge tono={tono} enfasis={enfasis} icon={icon}>
        {estado}
      </Badge>,
    );

    return screen.getByText(estado);
  }

  it.each(TODOS_LOS_ESTADOS)('«%s» sale con el fondo que le asigna el diccionario', (estado) => {
    const clases = pintar(estado).className.split(' ');

    // Coincidencia exacta de clase, no `toContain` sobre la cadena: si no,
    // `bg-attention` daría por bueno un `bg-attention-soft`, que es justo la
    // confusión que este test existe para detectar.
    expect(clases).toContain(FONDO_ESPERADO[estado]);
  });

  it.each(TODOS_LOS_ESTADOS)('«%s» lleva ícono además del color', (estado) => {
    expect(pintar(estado).querySelector('svg')).not.toBeNull();
  });

  it('ningún estado repite el ícono de otro: el ícono por sí solo ya distingue', () => {
    const iconos = TODOS_LOS_ESTADOS.map((estado) => varianteEstadoAula[estado].icon);

    expect(new Set(iconos).size).toBe(iconos.length);
  });

  it.each(TODOS_LOS_ESTADOS)(
    '«%s» pinta su riel con un token, nunca con un color literal',
    (estado) => {
      const { riel } = varianteEstadoAula[estado];

      expect(riel).toMatch(/^bg-[a-z-]+$/);
      expect(riel).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    },
  );
});
