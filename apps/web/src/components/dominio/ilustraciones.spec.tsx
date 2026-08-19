import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { IlustracionError, IlustracionNoEncontrado, IlustracionVacio } from './ilustraciones';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

const ILUSTRACIONES: { nombre: string; elemento: ReactElement }[] = [
  { nombre: 'vacío', elemento: <IlustracionVacio /> },
  { nombre: 'no encontrado', elemento: <IlustracionNoEncontrado /> },
  { nombre: 'error', elemento: <IlustracionError /> },
];

describe.each(ILUSTRACIONES)('Ilustración de $nombre', ({ elemento }) => {
  it('se anuncia como imagen con una descripción de lo que dibuja', () => {
    renderConProviders(elemento);

    const imagen = screen.getByRole('img');

    expect(imagen).toHaveAccessibleName();
    expect(imagen.getAttribute('aria-label')?.length).toBeGreaterThan(10);
  });

  it('no usa ni un color literal: solo tokens del tema', () => {
    const { container } = renderConProviders(elemento);
    const svg = container.querySelector('svg')?.outerHTML ?? '';

    // Un hex o un rgb() aquí dentro significaría un color que no cambia en
    // `.dark` ni en `.hc`: sobre fondo oscuro, una ilustración invisible.
    expect(svg).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    expect(svg).not.toMatch(/rgba?\(/);
    expect(svg).not.toMatch(/oklch\(/);
    // Y el color llega por clases de Tailwind, que sí se reescriben por tema.
    expect(svg).toMatch(/class="[^"]*(fill|stroke)-/);
  });

  it('no lleva degradados ni sombras', () => {
    const { container } = renderConProviders(elemento);
    const svg = container.querySelector('svg')?.outerHTML ?? '';

    expect(svg).not.toMatch(/Gradient/i);
    expect(svg).not.toMatch(/filter=/);
  });

  it.each(TEMAS)('se monta sin violaciones de accesibilidad en el tema %s', async (tema) => {
    const { container } = renderConProviders(elemento, { tema });

    await esperarSinFallosDeAccesibilidad(container);
  });
});
