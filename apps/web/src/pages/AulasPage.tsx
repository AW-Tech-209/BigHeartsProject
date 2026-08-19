import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';

/**
 * Listado de aulas disponibles. **El contenido llega en HU-203.**
 *
 * Existe ya porque `Aulas` es un destino de la navegación de los tres roles, y
 * un destino que lleva a un 404 es peor que no tenerlo: enseña al usuario a
 * desconfiar de la barra. Hasta HU-203 dice la verdad —todavía no hay aulas—
 * dentro de la misma estructura que tendrá después.
 */
export function AulasPage() {
  return (
    <AppShell>
      <PaginaCabecera
        titulo="Aulas"
        contexto="Las clases publicadas por los profesores de BigHearts, con su horario y su cupo."
      />

      <EstadoVacio
        titular="Todavía no hay aulas publicadas"
        ayuda="Cuando un profesor publique una clase, aparecerá aquí con su horario, su nivel y los cupos que queden."
      />
    </AppShell>
  );
}
