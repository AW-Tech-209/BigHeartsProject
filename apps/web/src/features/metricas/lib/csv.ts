import type { MetricasAcademia, MetricasIndicadores } from '@academia/types';

import { DIAS_SEMANA, hora, porcentaje, textoModo, textoNivel } from './formato';

export type ArchivoCsv = { nombre: string; contenido: string };

/** Una celda que empiece por `=`, `+`, `-` o `@` la ejecutaría una hoja de cálculo como fórmula. */
function celda(valor: string | number): string {
  const texto = String(valor);
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return /[",\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

function tabla(cabecera: string[], filas: (string | number)[][]): string {
  return [cabecera, ...filas].map((fila) => fila.map(celda).join(',')).join('\r\n');
}

const cifras = (i: MetricasIndicadores) => [
  i.clases,
  porcentaje(i.ocupacion),
  porcentaje(i.asistencia),
];
const CIFRAS = ['Clases', 'Ocupación', 'Asistencia'];

/** Un archivo por desglose, con las mismas cifras (y el mismo texto) que la pantalla. */
export function construirCsvs(datos: MetricasAcademia): ArchivoCsv[] {
  const base = `metricas-${datos.desde}_${datos.hasta}`;
  return [
    {
      nombre: `${base}-nivel.csv`,
      contenido: tabla(
        ['Nivel', ...CIFRAS],
        datos.porNivel.map((f) => [textoNivel(f.nivel), ...cifras(f)]),
      ),
    },
    {
      nombre: `${base}-modo.csv`,
      contenido: tabla(
        ['Modo de instrucción', ...CIFRAS],
        datos.porModo.map((f) => [textoModo(f.modo), ...cifras(f)]),
      ),
    },
    {
      nombre: `${base}-profesor.csv`,
      contenido: tabla(
        ['Profesor', ...CIFRAS],
        datos.porProfesor.map((f) => [f.nombre, ...cifras(f)]),
      ),
    },
    {
      nombre: `${base}-franja.csv`,
      contenido: tabla(
        ['Día', 'Hora', ...CIFRAS],
        datos.porFranja.map((f) => [
          DIAS_SEMANA[f.diaSemana - 1] ?? '',
          hora(f.hora),
          ...cifras(f),
        ]),
      ),
    },
  ];
}

export function descargarCsvs(archivos: ArchivoCsv[]): void {
  for (const { nombre, contenido } of archivos) {
    // El BOM hace que Excel abra las tildes como UTF-8.
    const url = URL.createObjectURL(new Blob(['﻿', contenido], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }
}
