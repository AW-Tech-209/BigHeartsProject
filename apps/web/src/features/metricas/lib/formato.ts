import { EnglishLevel, InstructionMode, type MetricasIndicadores } from '@academia/types';

import { etiquetaModoInstruccion } from '@/features/aulas/lib/accesibilidad-aula';
import { nivelesDeIngles } from '@/features/aulas/lib/niveles';

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const NIVELES_EN_ORDEN = [
  EnglishLevel.BEGINNER,
  EnglishLevel.INTERMEDIATE,
  EnglishLevel.ADVANCED,
];

export const SIN_DATOS = 'Sin datos';

/** Razón 0-1 → «72 %». `null` (denominador 0) se dice con palabras, no con «0 %». */
export function porcentaje(razon: number | null): string {
  return razon === null ? SIN_DATOS : `${Math.round(razon * 100)} %`;
}

export function textoClases(clases: number): string {
  return `${clases} ${clases === 1 ? 'clase' : 'clases'}`;
}

export function textoNivel(nivel: EnglishLevel): string {
  return nivelesDeIngles[nivel].nombre;
}

export function textoModo(modo: InstructionMode | null): string {
  return modo === null ? 'Sin declarar' : etiquetaModoInstruccion[modo];
}

export function hora(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

/** La misma frase para barra, tabla y lector de pantalla. */
export function resumenIndicadores(i: MetricasIndicadores): string {
  return `${textoClases(i.clases)} · ocupación ${porcentaje(i.ocupacion)} · asistencia ${porcentaje(i.asistencia)}`;
}
