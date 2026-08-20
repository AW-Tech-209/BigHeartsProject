import { describe, expect, it } from 'vitest';

import {
  formatRequestDate,
  fullName,
  resolutionCopy,
  type TeacherResolution,
} from './teacher-resolution';

const RESOLUCIONES: TeacherResolution[] = ['approve', 'reject'];

describe('resolutionCopy — las reglas de microcopy, verificadas', () => {
  it.each(RESOLUCIONES)('%s nombra a la persona en el título del diálogo', (resolucion) => {
    const titulo = resolutionCopy[resolucion].dialogTitle('Paula Profesora');

    // «¿Estás seguro?» es la forma de preguntar que obliga al usuario a
    // recordar sobre qué estaba decidiendo.
    expect(titulo).toContain('Paula Profesora');
    expect(titulo).not.toMatch(/seguro/i);
  });

  it.each(RESOLUCIONES)('%s confirma con un verbo, nunca con Sí/No', (resolucion) => {
    const { confirm, trigger } = resolutionCopy[resolucion];

    expect(confirm).not.toMatch(/^(sí|si|no|aceptar|confirmar|ok)$/i);
    expect(trigger).not.toMatch(/^(sí|si|no|aceptar|confirmar|ok)$/i);
  });

  it.each(RESOLUCIONES)('%s usa el mismo verbo en el botón, el diálogo y el anuncio', (r) => {
    const { trigger, confirm, announcement } = resolutionCopy[r];
    // La raíz del verbo: «Aprobar» → «aprob», «Rechazar» → «rechaz».
    const raiz = trigger.toLowerCase().slice(0, 5);

    expect(confirm.toLowerCase()).toContain(raiz);
    expect(announcement('Paula Profesora').toLowerCase()).toContain(raiz);
  });

  it.each(RESOLUCIONES)('%s anuncia el resultado nombrando a la persona', (resolucion) => {
    // El lector de pantalla no ve que la fila desapareció de la tabla.
    expect(resolutionCopy[resolucion].announcement('Paula Profesora')).toContain('Paula Profesora');
  });

  it('solo el rechazo es destructivo: el color significa pérdida, no decora', () => {
    expect(resolutionCopy.approve.variant).toBe('default');
    expect(resolutionCopy.reject.variant).toBe('destructive');
  });

  it('el rechazo advierte que el profesor no podrá entrar (B4)', () => {
    expect(resolutionCopy.reject.dialogDescription).toMatch(/no podrá entrar/i);
  });

  it.each(RESOLUCIONES)('%s tiene texto de espera, nunca un spinner mudo', (resolucion) => {
    expect(resolutionCopy[resolucion].pending.trim().length).toBeGreaterThan(0);
  });
});

describe('fullName', () => {
  it('junta nombre y apellido como se nombra a una persona', () => {
    expect(fullName({ firstName: 'Paula', lastName: 'Profesora' })).toBe('Paula Profesora');
  });
});

describe('formatRequestDate', () => {
  it('escribe la fecha entera, nunca en formato 12/08', () => {
    const formateada = formatRequestDate('2026-08-12T15:30:00.000Z');

    expect(formateada).toContain('12');
    expect(formateada).toContain('agosto');
    expect(formateada).toContain('2026');
    expect(formateada).not.toMatch(/\d{1,2}\/\d{1,2}/);
  });

  it('no inventa una hora: para decidir importa el día, no el minuto', () => {
    expect(formatRequestDate('2026-08-12T15:30:00.000Z')).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it('una fecha inválida se dice, no se imprime como «Invalid Date»', () => {
    expect(formatRequestDate('no es una fecha')).toBe('Fecha no disponible');
  });
});
