import { Contenedor } from '@/components/layout/contenedor';
import { Revelar } from './revelar';

export function SeccionCierre() {
  return (
    <section id="empezar" className="bg-background">
      <Contenedor className="py-20 sm:py-28">
        <Revelar>
          <h2 className="max-w-[24ch] font-serif text-4xl leading-[1.08] font-normal tracking-tight text-balance sm:text-5xl">
            Aprender inglés no debería ser más difícil por no poder oír.
          </h2>
          <p className="mt-8 max-w-[46ch] text-lg text-muted-foreground text-pretty">
            Para crear tu cuenta o entrar, usa los botones de la barra de arriba.
          </p>
        </Revelar>
      </Contenedor>
    </section>
  );
}
