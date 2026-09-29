import {
  EnglishLevel,
  InstructionMode,
  type MetricasAcademia,
  ProblemaClase,
  UserRole,
} from '@academia/types';
import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import { getMetricas } from '@/features/metricas/api/get-metricas';
import { construirCsvs } from '@/features/metricas/lib/csv';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/metricas/api/get-metricas', () => ({ getMetricas: vi.fn() }));

const metricas: MetricasAcademia = {
  desde: '2026-09-01',
  hasta: '2026-09-29',
  zonaHoraria: 'America/Bogota',
  resumen: {
    clasesPublicadas: 42,
    clasesCanceladas: 2,
    clasesImpartidas: 40,
    ocupacion: 0.72,
    asistencia: 0.85,
    clasesSinAsistenciaMarcada: 3,
    cancelacionesDeEstudiantes: 4,
    estudiantesActivos: 18,
    estudiantesNuevos: 5,
  },
  porFranja: [{ diaSemana: 2, hora: 18, clases: 6, ocupacion: 0.9, asistencia: 0.8 }],
  porNivel: [{ nivel: EnglishLevel.BEGINNER, clases: 20, ocupacion: 0.66, asistencia: 0.9 }],
  porModo: [{ modo: InstructionMode.LSC_NATIVA, clases: 30, ocupacion: 0.7, asistencia: 0.8 }],
  porProfesor: [
    { profesorId: 'p1', nombre: '=Paula Profesora', clases: 12, ocupacion: null, asistencia: null },
  ],
  valoraciones: {
    respuestas: 10,
    si: 6,
    aMedias: 3,
    no: 1,
    problemas: { [ProblemaClase.SUBTITULOS]: 4 } as MetricasAcademia['valoraciones']['problemas'],
    comentarios: [],
  },
};

const montar = (ruta = '/admin/metricas') => renderConProviders(<AppRoutes />, { ruta });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMetricas).mockResolvedValue(metricas);
});

describe('MetricasPage — autorización', () => {
  it.each([UserRole.STUDENT, UserRole.TEACHER])('%s no ve la pantalla', (rol) => {
    darSesion(rol);
    montar();

    expect(
      screen.getByRole('heading', { level: 1, name: 'No tienes acceso a esta página' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Métricas' })).toBeNull();
    expect(getMetricas).not.toHaveBeenCalled();
  });

  it('el admin ve el destino «Métricas»', async () => {
    darSesion(UserRole.ADMIN);
    montar();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Métricas de la academia' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Métricas' }).length).toBeGreaterThan(0);
  });
});

describe('MetricasPage — admin', () => {
  beforeEach(() => darSesion(UserRole.ADMIN));

  it('cambiar el rango cambia la query y vive en la URL', async () => {
    const { user } = montar('/admin/metricas?dias=7');
    await screen.findByText('Resumen');
    const primera = vi.mocked(getMetricas).mock.calls[0]![0];

    await user.click(screen.getByRole('button', { name: 'Últimos 90 días' }));

    await screen.findByText('Resumen');
    const ultima = vi.mocked(getMetricas).mock.calls.at(-1)![0];
    expect(ultima.desde).not.toBe(primera.desde);
    expect(ultima.hasta).toBe(primera.hasta);
  });

  it('cada valor está escrito y «Ver como tabla» muestra los mismos números', async () => {
    const { user } = montar();
    const nivel = (await screen.findByRole('heading', { name: 'Por nivel' })).closest('section')!;

    expect(within(nivel).getAllByText('66 %').length).toBeGreaterThan(0);
    expect(within(nivel).getAllByText('20 clases').length).toBeGreaterThan(0);
    expect(screen.getByText('6 clases')).toBeInTheDocument();
    expect(screen.getByText('Ocupación 90 %')).toBeInTheDocument();

    await user.click(within(nivel).getByRole('button', { name: 'Ver como tabla' }));
    const tabla = within(nivel).getByRole('table', { name: 'Por nivel' });
    expect(within(tabla).getByText('66 %')).toBeInTheDocument();
    expect(within(tabla).getByText('20')).toBeInTheDocument();
    expect(within(tabla).getByText('90 %')).toBeInTheDocument();
  });

  it('las clases sin asistencia marcada enlazan a supervisión', async () => {
    montar();
    expect(await screen.findByRole('link', { name: /Ir a supervisión de aulas/ })).toHaveAttribute(
      'href',
      '/admin/aulas',
    );
  });

  it('vacío: dice que no hubo clases', async () => {
    vi.mocked(getMetricas).mockResolvedValue({
      ...metricas,
      resumen: { ...metricas.resumen, clasesPublicadas: 0, clasesImpartidas: 0 },
    });
    montar();
    expect(await screen.findByText('No hubo clases en este rango')).toBeInTheDocument();
  });

  it('error: ofrece reintentar', async () => {
    vi.mocked(getMetricas).mockRejectedValue(new Error('x'));
    montar();
    expect(await screen.findByRole('button', { name: 'Volver a cargar' })).toBeInTheDocument();
  });

  it('axe limpio', async () => {
    const { container } = montar();
    await screen.findByText('Resumen');
    await esperarSinFallosDeAccesibilidad(container);
  });
});

describe('construirCsvs', () => {
  it('usa las mismas cifras que la pantalla y neutraliza fórmulas', () => {
    const archivos = construirCsvs(metricas);
    const nivel = archivos.find((a) => a.nombre.endsWith('-nivel.csv'))!;
    const profesor = archivos.find((a) => a.nombre.endsWith('-profesor.csv'))!;

    expect(nivel.nombre).toBe('metricas-2026-09-01_2026-09-29-nivel.csv');
    expect(nivel.contenido).toContain('Básico,20,66 %,90 %');
    expect(profesor.contenido).toContain("'=Paula Profesora,12,Sin datos,Sin datos");
  });
});
