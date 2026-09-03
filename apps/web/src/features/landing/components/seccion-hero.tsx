import { Contenedor } from '@/components/layout/contenedor';
import { usePageTitle } from '@/hooks/use-page-title';
import { AULAS_DEMO } from '../lib/aulas-demo';
import { CtaAcceso } from './cta-acceso';
import { RotuloSeccion } from './primitivos-landing';
import { Revelar } from './revelar';
import { TarjetaAulaDemo } from './tarjeta-aula-demo';

/**
 * La primera pantalla. Lleva el único `<h1>` de la landing y, como toda ruta de
 * la SPA, fija el título del documento y mueve el foco al encabezado al entrar
 * (mismo patrón que `<PaginaCabecera>`, que aquí no encaja por maquetación).
 */
export function SeccionHero() {
  const headingRef = usePageTitle('Inicio');
  const aulaEjemplo = AULAS_DEMO[0];

  return (
    <section
      id="inicio"
      className="relative scroll-mt-20 overflow-hidden border-b border-border bg-background"
    >
      {/* Textura geométrica, no color con significado: líneas del token `border`
          con un desvanecido radial. Decorativa y `aria-hidden`. */}
      <div
        aria-hidden="true"
        className="rejilla-hero pointer-events-none absolute inset-0 opacity-60"
      />
      <Contenedor className="relative grid gap-16 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
        <Revelar>
          <RotuloSeccion>Academia de inglés en línea</RotuloSeccion>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-7 max-w-[15ch] text-4xl font-medium tracking-tight text-balance outline-none"
          >
            Tu clase de inglés, en un lugar que{' '}
            <em className="font-serif text-[1.06em] font-normal italic">sí es tuyo.</em>
          </h1>
          <p className="mt-7 max-w-[52ch] text-lg text-muted-foreground text-pretty">
            BigHearts es una academia de inglés en línea para personas sordas e hipoacúsicas.
            Reservas tu cupo, sabes que es tuyo, y entras a la clase cuando llega la hora — sin
            buscar el enlace en un chat.
          </p>
          <CtaAcceso className="mt-9" />
          <p className="mt-7 max-w-[46ch] text-sm text-muted-foreground">
            La plataforma está hoy en un entorno de pruebas. Puedes crear tu cuenta y explorar; el
            paso a producción es posterior.
          </p>
        </Revelar>

        <Revelar retraso={120} className="grid gap-4">
          <h2 className="font-mono text-xs font-normal tracking-wide text-muted-foreground">
            Una clase, tal como se ve dentro
          </h2>
          {aulaEjemplo && <TarjetaAulaDemo aula={aulaEjemplo} rielAnimado />}
          <p className="max-w-[46ch] text-sm text-muted-foreground text-pretty">
            Cada tarjeta lleva una franja de color en el borde izquierdo con el estado de la clase.
            Se lee sin leer.
          </p>
        </Revelar>
      </Contenedor>
    </section>
  );
}
