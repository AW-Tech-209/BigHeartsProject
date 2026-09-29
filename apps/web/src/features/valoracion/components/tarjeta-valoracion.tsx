import { EstadoTemporalAula } from '@academia/types';
import { MessageSquareHeart } from 'lucide-react';
import { useState } from 'react';

import { Callout } from '@/components/ui/callout';
import { useMisReservas } from '@/features/aulas/hooks/use-mis-reservas';
import { useAnnounce } from '@/hooks/use-announce';
import { MENSAJE_GRACIAS } from '../lib/opciones';
import { FormularioValoracion } from './formulario-valoracion';

/** Cuántas clases pasadas se miran para hallar la más reciente por valorar. */
const PASADAS_A_MIRAR = 10;

/**
 * La tarjeta del panel del estudiante (HU-515): pregunta por la clase más
 * reciente que todavía se puede valorar y no pinta nada si no hay ninguna.
 * Al enviar se reemplaza por el agradecimiento; recargada, no vuelve para
 * esa reserva porque el servidor ya no la marca con `puedeValorar`.
 */
export function TarjetaValoracion() {
  const { data } = useMisReservas({
    estado: EstadoTemporalAula.PASADAS,
    pageSize: PASADAS_A_MIRAR,
  });
  const announce = useAnnounce();
  const [agradecida, setAgradecida] = useState(false);

  if (agradecida) {
    return (
      <Callout variant="success" live="polite" title="Respuesta enviada">
        <p>{MENSAJE_GRACIAS}</p>
      </Callout>
    );
  }

  const aula = data?.items.find((item) => item.puedeValorar && item.myBookingId);

  if (!aula?.myBookingId) return null;

  const tituloId = `valoracion-${aula.id}`;

  return (
    <section
      aria-labelledby={tituloId}
      className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <h2 id={tituloId} className="flex items-center gap-3 text-xl font-medium text-foreground">
        <span className="rounded-lg bg-primary-soft p-2 text-primary">
          <MessageSquareHeart aria-hidden="true" strokeWidth={2} className="size-5" />
        </span>
        Cuéntanos de tu última clase
      </h2>

      <FormularioValoracion
        key={aula.myBookingId}
        bookingId={aula.myBookingId}
        titulo={aula.title}
        onEnviada={() => {
          setAgradecida(true);
          announce(MENSAJE_GRACIAS);
        }}
      />
    </section>
  );
}
