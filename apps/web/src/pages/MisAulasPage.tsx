import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';

/**
 * Las aulas que imparte el profesor. **El contenido llega en HU-201 y HU-202.**
 * Ver la nota de `AulasPage`.
 */
export function MisAulasPage() {
  return (
    <AppShell>
      <PaginaCabecera
        titulo="Mis aulas"
        contexto="Las clases que impartes, con su horario, su cupo y los estudiantes inscritos."
      />

      <EstadoVacio
        titular="Todavía no creaste ninguna aula"
        ayuda="Cuando la función esté lista, aquí publicarás tus clases y verás quién reservó su cupo en cada una."
      />
    </AppShell>
  );
}
