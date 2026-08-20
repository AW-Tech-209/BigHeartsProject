import { Link } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';

/**
 * Las aulas que imparte el profesor.
 *
 * La ACCIÓN de crear ya funciona (HU-201); el LISTADO llega en HU-203, así que
 * de momento la pantalla es su estado vacío. Es una mezcla rara a propósito: sin
 * un sitio desde el que entrar, el formulario de creación solo sería alcanzable
 * escribiendo la URL a mano.
 *
 * El botón vive SOLO en el estado vacío mientras esta pantalla no tenga lista:
 * repetirlo también en la cabecera dejaría dos acciones primarias compitiendo en
 * la misma pantalla, que es lo que prohíbe `layout-y-composicion.md`. Cuando
 * HU-203 traiga la rejilla, el destino natural del botón es la cabecera.
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
        ayuda="Publica tu primera clase con su horario y su cupo. Aquí verás quién reservó en cada una."
        accion={
          <Button render={<Link to="/mis-aulas/nueva" />} className="h-12 px-6 text-base">
            Crear una clase
          </Button>
        }
      />
    </AppShell>
  );
}
