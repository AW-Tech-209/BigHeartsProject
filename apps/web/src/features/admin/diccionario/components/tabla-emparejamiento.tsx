import type { FilaCola } from '../lib/cola-subida';
import { type EntradaCola, FilaEmparejamiento, type MetaFila } from './fila-emparejamiento';

type TablaEmparejamientoProps = {
  filas: FilaCola<MetaFila>[];
  entradas: EntradaCola[];
  onAsignar: (filaId: number, entrada: EntradaCola) => void;
  onReemplazarArchivo: (filaId: number, archivo: File) => void;
};

/** Archivo → entrada → estado. Las filas mantienen el orden en que llegaron, también al subir. */
export function TablaEmparejamiento({
  filas,
  entradas,
  onAsignar,
  onReemplazarArchivo,
}: TablaEmparejamientoProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)_auto] gap-3 border-b border-border bg-muted px-5 py-2 text-sm text-muted-foreground sm:grid"
      >
        <span>Archivo</span>
        <span className="w-4" />
        <span>Entrada</span>
        <span>Estado</span>
      </div>
      <ul aria-label="Archivos para subir" className="divide-y divide-border">
        {filas.map((fila) => (
          <FilaEmparejamiento
            key={fila.id}
            fila={fila}
            entradas={entradas}
            onAsignar={(entrada) => onAsignar(fila.id, entrada)}
            onReemplazarArchivo={(archivo) => onReemplazarArchivo(fila.id, archivo)}
          />
        ))}
      </ul>
    </div>
  );
}
