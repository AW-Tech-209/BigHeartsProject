import type { ClassroomSupport, InstructionMode, MeetingProvider } from '@academia/types';
import { ChevronDown } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { guiaDePlataforma, ID_GUIA_ANTES_DE_ENTRAR } from '@/features/aulas/lib/guia-plataforma';
import { cn } from '@/lib/utils';

type GuiaAntesDeEntrarProps = {
  proveedor: MeetingProvider;
  modo: InstructionMode | null | undefined;
  apoyos: ClassroomSupport[];
  /** Llega desplegada cuando el acceso a la clase ya se abrió. */
  abiertaPorDefecto: boolean;
};

/**
 * Qué hacer en la plataforma de la clase antes de entrar. Es un acordeón hecho
 * a mano —botón con `aria-expanded`— porque solo hay un bloque y no compensa un
 * primitivo. Lo que el usuario abra o cierre gana sobre el valor por defecto.
 */
export function GuiaAntesDeEntrar({
  proveedor,
  modo,
  apoyos,
  abiertaPorDefecto,
}: GuiaAntesDeEntrarProps) {
  const guia = guiaDePlataforma(proveedor, modo, apoyos);
  const { hash } = useLocation();
  const pedidaPorEnlace = hash === `#${ID_GUIA_ANTES_DE_ENTRAR}`;
  const [eleccion, setEleccion] = useState<boolean | null>(null);
  const abierta = eleccion ?? (pedidaPorEnlace || abiertaPorDefecto);
  const botonRef = useRef<HTMLButtonElement>(null);

  // React Router no baja al ancla por sí solo, y el bloque llega tras cargar el aula.
  useEffect(() => {
    if (!pedidaPorEnlace) return;
    botonRef.current?.scrollIntoView({ block: 'start' });
    botonRef.current?.focus();
  }, [pedidaPorEnlace]);

  const tituloId = `${ID_GUIA_ANTES_DE_ENTRAR}-titulo`;
  const contenidoId = `${ID_GUIA_ANTES_DE_ENTRAR}-pasos`;

  return (
    <section
      id={ID_GUIA_ANTES_DE_ENTRAR}
      aria-labelledby={tituloId}
      className="scroll-mt-24 rounded-xl border border-border bg-card shadow-xs"
    >
      <h2 id={tituloId} className="text-xl font-medium">
        <button
          ref={botonRef}
          type="button"
          aria-expanded={abierta}
          aria-controls={contenidoId}
          onClick={() => setEleccion(!abierta)}
          className="transicion-rapida flex min-h-14 w-full items-center justify-between gap-3 rounded-xl p-6 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-7"
        >
          {guia.titulo}
          <ChevronDown
            aria-hidden="true"
            strokeWidth={2}
            className={cn('size-5 shrink-0 text-muted-foreground', abierta && 'rotate-180')}
          />
        </button>
      </h2>

      <div id={contenidoId} hidden={!abierta} className="px-6 pb-6 sm:px-7 sm:pb-7">
        <ol className="space-y-4">
          {guia.pasos.map(({ clave, icono: Icono, partes }, indice) => (
            <li key={clave} className="flex items-start gap-3">
              <span className="rounded-lg bg-primary-soft p-2 text-primary">
                <Icono aria-hidden="true" strokeWidth={2} className="size-5" />
              </span>
              <p className="max-w-[65ch] pt-1.5 text-base leading-relaxed">
                <span aria-hidden="true" className="font-medium">
                  {indice + 1}.{' '}
                </span>
                {partes.map((parte, i) =>
                  typeof parte === 'string' ? (
                    <Fragment key={i}>{parte}</Fragment>
                  ) : (
                    <strong key={i}>{parte.boton}</strong>
                  ),
                )}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
