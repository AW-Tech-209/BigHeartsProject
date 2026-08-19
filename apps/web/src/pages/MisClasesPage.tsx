import { Link } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';

/**
 * Las clases que el estudiante tiene reservadas. **El contenido llega en el
 * Sprint 3**, cuando exista `Booking`. Ver la nota de `AulasPage`.
 */
export function MisClasesPage() {
  return (
    <AppShell>
      <PaginaCabecera
        titulo="Mis clases"
        contexto="Las clases que reservaste, con la hora en que se abre el acceso a cada una."
      />

      <EstadoVacio
        titular="Todavía no tienes clases reservadas"
        ayuda="Cuando reserves tu cupo en un aula, la verás aquí con su fecha y su enlace de acceso."
        accion={
          <Button render={<Link to="/aulas" />} className="h-12 px-6 text-base">
            Explorar las aulas
          </Button>
        }
      />
    </AppShell>
  );
}
