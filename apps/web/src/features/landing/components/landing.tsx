import { SkipLink } from '@/components/skip-link';
import { CabeceraLanding } from './cabecera-landing';
import { PieLanding } from './pie-landing';
import { SeccionAcceso } from './seccion-acceso';
import { SeccionAccesibilidad } from './seccion-accesibilidad';
import { SeccionCatalogo } from './seccion-catalogo';
import { SeccionCierre } from './seccion-cierre';
import { SeccionHero } from './seccion-hero';
import { SeccionPasos } from './seccion-pasos';
import { SeccionProblema } from './seccion-problema';
import { SeccionProfesores } from './seccion-profesores';
import { SeccionReglas } from './seccion-reglas';

/**
 * La landing pública de BigHearts, en `/`. Presenta el producto y lleva a
 * `/registro` e `/login` — el registro ya está abierto en la app.
 *
 * No se monta sobre `<AppShell>` a propósito: es una página de marketing con
 * cabecera y pie propios y secciones a sangre completa, no una pantalla de la
 * aplicación. Conserva lo que sí es común: `<SkipLink>`, un único `<h1>` (en el
 * hero, con foco y título de documento) y `<main id="contenido">`.
 */
export function Landing() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipLink />
      <CabeceraLanding />

      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        <SeccionHero />
        <SeccionProblema />
        <SeccionPasos />
        <SeccionCatalogo />
        <SeccionAcceso />
        <SeccionReglas />
        <SeccionProfesores />
        <SeccionAccesibilidad />
        <SeccionCierre />
      </main>

      <PieLanding />
    </div>
  );
}
