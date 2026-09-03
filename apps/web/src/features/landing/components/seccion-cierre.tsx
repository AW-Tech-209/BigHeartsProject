import { Contenedor } from '@/components/layout/contenedor';
import { CtaAcceso } from './cta-acceso';
import { Revelar } from './revelar';

export function SeccionCierre() {
  return (
    <section id="empezar" className="bg-background">
      <Contenedor className="py-20 sm:py-28">
        <Revelar>
          <h2 className="max-w-[24ch] font-serif text-4xl leading-[1.08] font-normal tracking-tight text-balance sm:text-5xl">
            Aprender inglés no debería ser más difícil por no poder oír.
          </h2>
          <CtaAcceso className="mt-10" />
        </Revelar>
      </Contenedor>
    </section>
  );
}
