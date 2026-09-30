import { ChevronDown } from 'lucide-react';

/** Los comentarios como citas: texto suelto, sin autor ni fecha con qué cruzarlos. */
export function CitasDeComentarios({ comentarios }: { comentarios: string[] }) {
  return (
    <ul className="space-y-3">
      {comentarios.map((comentario, indice) => (
        <li key={indice}>
          <blockquote className="max-w-[65ch] border-l-2 border-border pl-4 text-base leading-relaxed whitespace-pre-line text-foreground">
            {comentario}
          </blockquote>
        </li>
      ))}
    </ul>
  );
}

/** El desplegable del historial. `<details>` ya anuncia su estado y abre con Enter y Espacio. */
export function ComentariosDesplegables({ comentarios }: { comentarios: string[] }) {
  if (comentarios.length === 0) return null;

  return (
    <details className="group mt-2">
      <summary className="flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-lg text-sm font-medium text-primary underline-offset-4 hover:underline">
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2}
          className="size-4 transition-transform group-open:rotate-180"
        />
        Lo que escribieron tus estudiantes ({comentarios.length})
      </summary>
      <div className="pt-2 pb-1">
        <CitasDeComentarios comentarios={comentarios} />
      </div>
    </details>
  );
}
