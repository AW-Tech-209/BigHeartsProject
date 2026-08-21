import { CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { Button } from '@/components/ui/button';

/**
 * El inicio del estudiante: sus próximas clases reservadas.
 *
 * **En el Sprint 2 siempre muestra el vacío, y no es un descuido.** `Booking`
 * no existe hasta el Sprint 3, así que no hay ninguna reserva que listar y no
 * hay ninguna consulta que hacer. HU-301 trae el dato y esta pieza pasa a tener
 * sus cuatro estados; hasta entonces tiene uno, porque uno es la verdad.
 *
 * El texto es lo delicado de este bloque (HU-209, AC2b). Mandar al estudiante a
 * reservar cuando reservar todavía no existe sería repetir exactamente el fallo
 * que originó esta historia: la pantalla prometiendo lo que el producto no
 * hace. Por eso invita a **mirar el catálogo**, que es lo único que hoy puede
 * hacer de verdad, y describe lo que va a encontrar ahí.
 */
export function PanelEstudiante() {
  return (
    <section aria-labelledby="panel-estudiante" className="space-y-4">
      <h2
        id="panel-estudiante"
        className="flex items-center gap-2 text-xl font-medium text-foreground"
      >
        <CalendarCheck aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
        Tus clases
      </h2>

      <EstadoVacio
        titular="No tienes clases reservadas"
        ayuda="En el catálogo están las clases de la academia, cada una con su horario, su nivel y los cupos que quedan."
        accion={
          <Button render={<Link to="/aulas" />} className="h-12 px-6 text-base">
            Explorar clases
          </Button>
        }
      />
    </section>
  );
}
