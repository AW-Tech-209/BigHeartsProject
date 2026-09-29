import type { MetricasIndicadores } from '@academia/types';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { porcentaje, resumenIndicadores, textoClases } from '../lib/formato';

export type FilaDesglose = { clave: string; etiqueta: string; datos: MetricasIndicadores };

/**
 * Barras horizontales de ocupación con el valor escrito al final, y la misma
 * información como `<table>`. El largo de la barra nunca es la única señal.
 */
export function Desglose({ titulo, filas }: { titulo: string; filas: FilaDesglose[] }) {
  const [comoTabla, setComoTabla] = useState(false);
  const tituloId = useId();

  return (
    <section aria-labelledby={tituloId} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={tituloId} className="text-xl font-medium text-foreground">
          {titulo}
        </h2>
        <Button variant="outline" onClick={() => setComoTabla((v) => !v)} className="h-11 px-5">
          {comoTabla ? 'Ver como barras' : 'Ver como tabla'}
        </Button>
      </div>

      {filas.length === 0 ? (
        <p className="text-muted-foreground">No hubo clases en este rango.</p>
      ) : comoTabla ? (
        <Table>
          <TableCaption className="sr-only">{titulo}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{titulo.replace('Por ', '')}</TableHead>
              <TableHead>Clases</TableHead>
              <TableHead>Ocupación</TableHead>
              <TableHead>Asistencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map(({ clave, etiqueta, datos }) => (
              <TableRow key={clave}>
                <TableHead scope="row" className="text-base text-foreground">
                  {etiqueta}
                </TableHead>
                <TableCell>{datos.clases}</TableCell>
                <TableCell>{porcentaje(datos.ocupacion)}</TableCell>
                <TableCell>{porcentaje(datos.asistencia)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <ul className="space-y-4">
          {filas.map(({ clave, etiqueta, datos }) => (
            <li key={clave} className="space-y-1">
              <p className="flex flex-wrap justify-between gap-x-4 font-medium text-foreground">
                <span>{etiqueta}</span>
                <span className="tabular-nums">{textoClases(datos.clases)}</span>
              </p>
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="h-3 flex-1 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-info"
                    style={{ width: `${Math.round((datos.ocupacion ?? 0) * 100)}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right font-medium tabular-nums text-foreground">
                  {porcentaje(datos.ocupacion)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{resumenIndicadores(datos)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
