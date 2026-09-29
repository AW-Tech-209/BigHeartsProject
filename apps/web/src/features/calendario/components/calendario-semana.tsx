import { useEsMovil } from '@/hooks/use-es-movil';
import { cn } from '@/lib/utils';

import { agruparPorDia, aClaveDia, diasDeSemana } from '../lib/semana';
import { EventoCalendario, type AulaEnCalendario } from './evento-calendario';

const nombreDia = new Intl.DateTimeFormat('es', { weekday: 'long' });
const fechaCorta = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

const etiqueta = (dia: Date) => {
  const texto = nombreDia.format(dia);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

type Props = { lunes: string; items: AulaEnCalendario[]; ahora?: Date };

/**
 * La semana de lunes a domingo: 7 columnas en escritorio, agenda día por día en
 * móvil (una rejilla de 7 no se lee a 375 px). Solo lectura.
 */
export function CalendarioSemana({ lunes, items, ahora = new Date() }: Props) {
  const esMovil = useEsMovil();
  const porDia = agruparPorDia(items);
  const hoy = aClaveDia(ahora);
  const dias = diasDeSemana(lunes).map((fecha) => {
    const clave = aClaveDia(fecha);
    return { fecha, clave, esHoy: clave === hoy, clases: porDia.get(clave) ?? [] };
  });

  const encabezado = (d: (typeof dias)[number]) => (
    <>
      {etiqueta(d.fecha)} {fechaCorta.format(d.fecha)}
      {d.esHoy && (
        <span className="ml-2 rounded-full border border-primary bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-soft-foreground">
          Hoy
        </span>
      )}
    </>
  );

  if (esMovil) {
    const sinClases = dias.filter((d) => d.clases.length === 0);
    return (
      <div className="space-y-6">
        {dias
          .filter((d) => d.clases.length > 0)
          .map((d) => (
            <section key={d.clave} aria-labelledby={`dia-${d.clave}`} className="space-y-3">
              <h3 id={`dia-${d.clave}`} className="text-lg font-medium text-foreground">
                {encabezado(d)}
              </h3>
              <ul className="space-y-3">
                {d.clases.map((aula) => (
                  <li key={aula.id}>
                    <EventoCalendario aula={aula} ahora={ahora} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        {sinClases.length > 0 && (
          <details className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer font-medium text-foreground">
              Sin clases ({sinClases.length} {sinClases.length === 1 ? 'día' : 'días'})
            </summary>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {sinClases.map((d) => (
                <li key={d.clave}>
                  {etiqueta(d.fecha)} {fechaCorta.format(d.fecha)}
                  {d.esHoy && ' · Hoy'}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-3">
      {dias.map((d) => (
        <section
          key={d.clave}
          aria-labelledby={`dia-${d.clave}`}
          className={cn(
            'min-w-0 space-y-3 rounded-xl border bg-card p-3',
            d.esHoy ? 'border-primary' : 'border-border',
          )}
        >
          <h3 id={`dia-${d.clave}`} className="text-sm font-medium text-foreground">
            {encabezado(d)}
          </h3>
          {d.clases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin clases</p>
          ) : (
            <ul className="space-y-3">
              {d.clases.map((aula) => (
                <li key={aula.id}>
                  <EventoCalendario aula={aula} ahora={ahora} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
