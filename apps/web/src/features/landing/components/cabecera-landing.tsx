import { MarcaBigHearts } from '@/components/dominio/marca-bighearts';
import { Contenedor } from '@/components/layout/contenedor';
import { SelectorTema } from '@/components/layout/selector-tema';
import { CtaAcceso } from './cta-acceso';

const ANCLAS = [
  { href: '#problema', texto: 'El problema' },
  { href: '#catalogo', texto: 'Las clases' },
  { href: '#acceso', texto: 'El acceso' },
  { href: '#profesores', texto: 'Profesores' },
];

/**
 * La cabecera propia de la landing (no el `<AppShell>`: aquí todavía no hay
 * sesión ni destinos de app, y las secciones van a sangre completa). Marca a la
 * izquierda, anclas a las secciones en escritorio, y siempre el selector de tema
 * y las acciones de acceso.
 */
export function CabeceraLanding() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <Contenedor className="flex h-16 items-center justify-between gap-4">
        <a
          href="#inicio"
          className="flex shrink-0 items-center gap-2.5 rounded-lg text-lg font-medium text-primary hover:underline"
        >
          <MarcaBigHearts className="size-6" />
          BigHearts
        </a>

        <nav aria-label="Secciones de esta página" className="hidden items-center gap-1 md:flex">
          {ANCLAS.map(({ href, texto }) => (
            <a
              key={href}
              href={href}
              className="inline-flex h-11 items-center rounded-lg px-3 text-sm text-foreground hover:bg-muted"
            >
              {texto}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <SelectorTema />
          <CtaAcceso compacto />
        </div>
      </Contenedor>
    </header>
  );
}
