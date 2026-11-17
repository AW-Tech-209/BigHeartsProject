import type { EstadoFilaImportacion, FilaImportacion } from '@academia/types';
import { CircleAlert, Copy, type LucideIcon, Plus } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChipFiltro, GrupoFiltros } from '@/features/diccionario/components/chip-filtro';
import { useEsMovil } from '@/hooks/use-es-movil';
import { cn } from '@/lib/utils';

const ESTADO: Record<
  EstadoFilaImportacion,
  { texto: string; icono: LucideIcon; tono: 'info' | 'neutral' | 'destructive' }
> = {
  nueva: { texto: 'Nueva', icono: Plus, tono: 'info' },
  duplicada: { texto: 'Duplicada', icono: Copy, tono: 'neutral' },
  error: { texto: 'Error', icono: CircleAlert, tono: 'destructive' },
};

const FILTROS: { valor: EstadoFilaImportacion | null; texto: string }[] = [
  { valor: null, texto: 'Todas' },
  { valor: 'nueva', texto: 'Nuevas' },
  { valor: 'duplicada', texto: 'Duplicadas' },
  { valor: 'error', texto: 'Con errores' },
];

const ubicacion = (f: FilaImportacion) => `M${f.modulo}${f.unidad ? ` · ${f.unidad}` : ''}`;

function Resultado({ fila }: { fila: FilaImportacion }) {
  const { texto, icono, tono } = ESTADO[fila.estado];
  return (
    <span className="flex flex-col items-start gap-1">
      <Badge tono={tono} icon={icono} className="px-2 py-0.5 text-sm">
        {texto}
      </Badge>
      {fila.motivo && <span className="text-sm">{fila.motivo}</span>}
      {fila.unidadNueva && fila.estado === 'nueva' && (
        <span className="text-sm text-muted-foreground">Crea la unidad {fila.unidad}.</span>
      )}
    </span>
  );
}

/** Cada fila con su resultado y, si falla, su motivo. En móvil, una tarjeta por fila. */
export function TablaVistaPrevia({ filas }: { filas: FilaImportacion[] }) {
  const esMovil = useEsMovil();
  const [filtro, setFiltro] = useState<EstadoFilaImportacion | null>(null);
  const visibles = filtro ? filas.filter((f) => f.estado === filtro) : filas;
  const conteo = (valor: EstadoFilaImportacion | null) =>
    valor ? filas.filter((f) => f.estado === valor).length : filas.length;

  return (
    <div className="space-y-4">
      <GrupoFiltros titulo="Mostrar">
        {FILTROS.map((f) => (
          <ChipFiltro
            key={f.texto}
            activo={filtro === f.valor}
            conteo={conteo(f.valor)}
            onClick={() => setFiltro(f.valor)}
          >
            {f.texto}
          </ChipFiltro>
        ))}
      </GrupoFiltros>

      {esMovil ? (
        <ul className="space-y-3">
          {visibles.map((f) => (
            <li
              key={f.fila}
              className={cn(
                'space-y-2 rounded-xl border border-border bg-card p-4',
                f.estado === 'error' && 'border-l-4 border-l-destructive bg-destructive-soft/40',
              )}
            >
              <p className="text-sm text-muted-foreground">Fila {f.fila}</p>
              <p className="text-base">
                <strong lang="en" className="[overflow-wrap:anywhere]">
                  {f.ingles || '—'}
                </strong>
                {' · '}
                <span className="[overflow-wrap:anywhere]">{f.espanol || '—'}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {f.tipo} · {ubicacion(f)} · {f.categoria}
              </p>
              <Resultado fila={f} />
            </li>
          ))}
        </ul>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fila</TableHead>
              <TableHead>Inglés</TableHead>
              <TableHead>Español</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.map((f) => (
              <TableRow
                key={f.fila}
                className={cn(
                  f.estado === 'error' && 'border-l-4 border-l-destructive bg-destructive-soft/40',
                )}
              >
                <TableCell>{f.fila}</TableCell>
                <TableCell>
                  <span lang="en" className="font-semibold">
                    {f.ingles}
                  </span>
                </TableCell>
                <TableCell>{f.espanol}</TableCell>
                <TableCell>{f.tipo}</TableCell>
                <TableCell className="whitespace-nowrap">{ubicacion(f)}</TableCell>
                <TableCell>{f.categoria}</TableCell>
                <TableCell>
                  <Resultado fila={f} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <p className="text-base text-muted-foreground">
        Se muestran {visibles.length} de {filas.length} filas. Las filas con error no se importan:
        corrígelas en el archivo y súbelo otra vez, o sigue sin ellas.
      </p>
    </div>
  );
}
