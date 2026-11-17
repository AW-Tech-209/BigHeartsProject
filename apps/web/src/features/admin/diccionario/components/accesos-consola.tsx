import {
  ChevronRight,
  FileSpreadsheet,
  Layers,
  ListVideo,
  type LucideIcon,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Acceso = { to: string; titulo: string; detalle: string; icono: LucideIcon };

export function AccesosConsola({
  sinSena,
  enPapelera,
  modulos,
  categorias,
}: {
  sinSena: number;
  enPapelera: number;
  modulos: number;
  categorias: number;
}) {
  const accesos: Acceso[] = [
    {
      to: '/admin/diccionario/grabacion',
      titulo: 'Cola de grabación',
      detalle: `${sinSena} sin seña · subir videos`,
      icono: ListVideo,
    },
    {
      to: '/admin/diccionario/estructura',
      titulo: 'Estructura',
      detalle: `${modulos} módulos · ${categorias} categorías`,
      icono: Layers,
    },
    {
      to: '/admin/diccionario/importar',
      titulo: 'Importar CSV',
      detalle: 'Agregar entradas desde un archivo',
      icono: FileSpreadsheet,
    },
    {
      to: '/admin/diccionario/papelera',
      titulo: 'Papelera',
      detalle: `${enPapelera} ${enPapelera === 1 ? 'entrada' : 'entradas'} para restaurar`,
      icono: Trash2,
    },
  ];

  return (
    <nav aria-label="Herramientas del diccionario">
      <ul className="grid gap-4 sm:grid-cols-2">
        {accesos.map(({ to, titulo, detalle, icono: Icono }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex h-full items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transicion-suave hover:shadow-sm"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <Icono aria-hidden="true" strokeWidth={2} className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-lg font-semibold">{titulo}</span>
                <span className="text-base text-muted-foreground">{detalle}</span>
              </span>
              <ChevronRight aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
