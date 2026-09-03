import { Contenedor } from '@/components/layout/contenedor';
import { CtaAcceso } from './cta-acceso';

export function SeccionCierre() {
  return (
    <section id="empezar" className="bg-background">
      <Contenedor className="py-20 sm:py-28">
        <h2 className="max-w-[22ch] text-3xl font-medium tracking-tight text-balance sm:text-4xl">
          Aprender inglés no debería ser más difícil por no poder oír.
        </h2>
        <CtaAcceso className="mt-10" />
      </Contenedor>
    </section>
  );
}
