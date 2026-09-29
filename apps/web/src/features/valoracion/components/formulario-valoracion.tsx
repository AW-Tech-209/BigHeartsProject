import {
  ProblemaClase,
  SeguimientoClase,
  VALORACION_COMENTARIO_MAX,
  type CrearValoracionInput,
} from '@academia/types';
import { Check, LoaderCircle, Send } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { useCrearValoracion } from '../hooks/use-crear-valoracion';
import { mensajeErrorValoracion } from '../lib/mensaje-error-valoracion';
import { OPCIONES_SEGUIMIENTO, TEXTO_PROBLEMA } from '../lib/opciones';

type FormularioValoracionProps = {
  bookingId: string;
  /** Título de la clase, para que la pregunta nombre el objeto. */
  titulo: string;
  onEnviada: () => void;
};

/**
 * «¿Pudiste seguir la clase?» (HU-515). «Sí» envía en un solo paso; «A medias»
 * y «No» abren los problemas y el comentario, ambos opcionales. Sin
 * optimismo: `onEnviada` solo corre cuando el servidor confirma.
 */
export function FormularioValoracion({ bookingId, titulo, onEnviada }: FormularioValoracionProps) {
  const preguntaId = useId();
  const mutation = useCrearValoracion(bookingId, onEnviada);
  const [seguimiento, setSeguimiento] = useState<SeguimientoClase | null>(null);
  const [problemas, setProblemas] = useState<ProblemaClase[]>([]);
  const [comentario, setComentario] = useState('');

  function enviar(input: CrearValoracionInput) {
    mutation.mutate(input);
  }

  function elegir(valor: SeguimientoClase) {
    if (valor === SeguimientoClase.SI) {
      enviar({ seguimiento: valor });
      return;
    }

    setSeguimiento(valor);
  }

  function alternarProblema(problema: ProblemaClase) {
    setProblemas((actuales) =>
      actuales.includes(problema)
        ? actuales.filter((actual) => actual !== problema)
        : [...actuales, problema],
    );
  }

  function enviarConDetalle() {
    if (!seguimiento) return;

    const texto = comentario.trim();
    enviar({
      seguimiento,
      ...(problemas.length > 0 && { problemas }),
      ...(texto && { comentario: texto }),
    });
  }

  return (
    <div className="space-y-4">
      <p id={preguntaId} className="text-base font-medium text-foreground">
        ¿Pudiste seguir la clase {titulo}?
      </p>

      <div role="group" aria-labelledby={preguntaId} className="grid gap-3 sm:grid-cols-3">
        {OPCIONES_SEGUIMIENTO.map(({ valor, texto, icono: Icono }) => {
          const elegida = seguimiento === valor;

          return (
            <button
              key={valor}
              type="button"
              aria-pressed={valor === SeguimientoClase.SI ? undefined : elegida}
              disabled={mutation.isPending}
              onClick={() => elegir(valor)}
              className={cn(
                'flex min-h-14 items-center justify-center gap-2.5 rounded-xl border bg-card px-4 text-base font-medium text-foreground transicion-rapida',
                'hover:border-input disabled:opacity-60',
                elegida ? 'border-primary bg-primary-soft' : 'border-border',
              )}
            >
              <Icono
                aria-hidden="true"
                strokeWidth={2}
                className={cn('size-6', elegida ? 'text-primary' : 'text-muted-foreground')}
              />
              {texto}
            </button>
          );
        })}
      </div>

      {seguimiento && (
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-base font-medium text-foreground">
              ¿Qué falló? <span className="font-normal text-muted-foreground">(opcional)</span>
            </legend>

            <div className="flex flex-wrap gap-2">
              {Object.values(ProblemaClase).map((problema) => {
                const elegido = problemas.includes(problema);

                return (
                  <label
                    key={problema}
                    className={cn(
                      'flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-base transicion-rapida',
                      'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                      elegido
                        ? 'border-primary bg-primary-soft text-foreground'
                        : 'border-border bg-card text-foreground hover:border-input',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={elegido}
                      disabled={mutation.isPending}
                      onChange={() => alternarProblema(problema)}
                      className="sr-only"
                    />
                    {elegido && (
                      <Check aria-hidden="true" strokeWidth={3} className="size-4 text-primary" />
                    )}
                    {TEXTO_PROBLEMA[problema]}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Field id={`${preguntaId}-comentario`} label="Cuéntanos más (opcional)">
            <textarea
              rows={3}
              maxLength={VALORACION_COMENTARIO_MAX}
              value={comentario}
              disabled={mutation.isPending}
              onChange={(event) => setComentario(event.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base text-foreground"
            />
          </Field>

          <Button
            onClick={enviarConDetalle}
            disabled={mutation.isPending}
            className="h-12 gap-2 px-6 text-base"
          >
            {mutation.isPending ? (
              <>
                <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Send aria-hidden="true" strokeWidth={2} className="size-5" />
                Enviar respuesta
              </>
            )}
          </Button>
        </div>
      )}

      {mutation.isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos enviar tu respuesta">
          <p>{mensajeErrorValoracion(mutation.error)}</p>
        </Callout>
      )}
    </div>
  );
}
