import { BookingStatus, ClassroomSupport, InstructionMode, MeetingProvider } from '@academia/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { debeMostrarGuia, guiaDePlataforma } from '@/features/aulas/lib/guia-plataforma';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { GuiaAntesDeEntrar } from './guia-antes-de-entrar';

function guia(
  proveedor: MeetingProvider,
  modo: InstructionMode | null,
  abiertaPorDefecto = true,
  apoyos: ClassroomSupport[] = [],
) {
  return renderConProviders(
    <GuiaAntesDeEntrar
      proveedor={proveedor}
      modo={modo}
      apoyos={apoyos}
      abiertaPorDefecto={abiertaPorDefecto}
    />,
  );
}

describe('guiaDePlataforma', () => {
  it('cada proveedor tiene título y contenido propios; MANUAL dice «tu plataforma»', () => {
    const textos = [
      MeetingProvider.ZOOM,
      MeetingProvider.GOOGLE_MEET,
      MeetingProvider.MICROSOFT_TEAMS,
      MeetingProvider.MANUAL,
    ].map((p) => guiaDePlataforma(p, InstructionMode.INTERPRETE_LSC, []));

    expect(textos.map((g) => g.titulo)).toEqual([
      'Antes de entrar a Zoom',
      'Antes de entrar a Google Meet',
      'Antes de entrar a Microsoft Teams',
      'Antes de entrar a tu plataforma',
    ]);
    expect(new Set(textos.map((g) => JSON.stringify(g.pasos.map((p) => p.partes)))).size).toBe(4);
  });

  it('con subtítulos en vivo declarados, el paso de subtítulos va primero', () => {
    const con = guiaDePlataforma(MeetingProvider.ZOOM, null, [ClassroomSupport.LIVE_CAPTIONS]);
    const sin = guiaDePlataforma(MeetingProvider.ZOOM, null, []);

    expect(con.pasos[0]?.clave).toBe('subtitulos');
    expect(sin.pasos[0]?.clave).toBe('fijar-video');
  });
});

describe('debeMostrarGuia', () => {
  it('solo con reserva CONFIRMED en una clase que no terminó', () => {
    expect(debeMostrarGuia(BookingStatus.CONFIRMED, false)).toBe(true);
    expect(debeMostrarGuia(null, false)).toBe(false);
    expect(debeMostrarGuia(BookingStatus.CANCELLED, false)).toBe(false);
    expect(debeMostrarGuia(BookingStatus.CONFIRMED, true)).toBe(false);
  });
});

describe('<GuiaAntesDeEntrar />', () => {
  it('Zoom con intérprete habla de fijar al intérprete', () => {
    guia(MeetingProvider.ZOOM, InstructionMode.INTERPRETE_LSC);

    expect(screen.getByRole('button', { name: 'Antes de entrar a Zoom' })).toBeInTheDocument();
    expect(screen.getByText(/video del intérprete/)).toBeInTheDocument();
    expect(screen.getByText('Fijar').tagName).toBe('STRONG');
  });

  it('Meet con LSC nativa habla de fijar al profesor', () => {
    guia(MeetingProvider.GOOGLE_MEET, InstructionMode.LSC_NATIVA);

    expect(screen.getByText(/video del profesor/)).toBeInTheDocument();
  });

  it('sin modo declarado nombra a «la persona que signa»', () => {
    guia(MeetingProvider.MICROSOFT_TEAMS, null);

    expect(screen.getByText(/video de la persona que signa/)).toBeInTheDocument();
  });

  it('cerrada por defecto, se abre con el teclado y anuncia su estado', async () => {
    const { user } = guia(MeetingProvider.ZOOM, InstructionMode.LSC_NATIVA, false);
    const boton = screen.getByRole('button', { name: 'Antes de entrar a Zoom' });

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    await user.tab();
    expect(boton).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list')).toBeInTheDocument();

    await user.keyboard(' ');
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });

  it('con el acceso abierto llega desplegada', () => {
    guia(MeetingProvider.ZOOM, InstructionMode.LSC_NATIVA, true);

    expect(screen.getByRole('button', { name: 'Antes de entrar a Zoom' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('no tiene fallos de accesibilidad', async () => {
    const { container } = guia(MeetingProvider.ZOOM, InstructionMode.INTERPRETE_LSC);

    await esperarSinFallosDeAccesibilidad(container);
  });
});
