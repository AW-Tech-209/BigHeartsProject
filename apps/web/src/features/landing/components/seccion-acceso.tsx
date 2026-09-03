import { ExternalLink, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FASES_ACCESO, faseAccesoEn, relojDeFase, type TonoFase } from '../lib/fases-acceso';
import { useMovimientoReducido } from '../lib/use-movimiento-reducido';
import { Revelar } from './revelar';
import { RotuloSeccion, SeccionLanding } from './primitivos-landing';

const TICK_MS = 120;

const PANEL: Record<TonoFase, string> = {
  muted: 'bg-muted',
  info: 'bg-info-soft text-info-soft-foreground',
  attention: 'bg-attention-soft text-attention-soft-foreground',
  'attention-solido': 'bg-attention text-attention-foreground',
};

const RIEL: Record<TonoFase, string> = {
  muted: 'bg-muted-foreground',
  info: 'bg-info',
  attention: 'bg-attention',
  'attention-solido': 'bg-attention',
};

export function SeccionAcceso() {
  const movimientoReducido = useMovimientoReducido();
  const [indice, setIndice] = useState(0);
  const [auto, setAuto] = useState(true);
  const [transcurrido, setTranscurrido] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const reproduce = auto && !movimientoReducido;
  const fase = faseAccesoEn(indice);
  const IconoFase = fase.icon;

  // El reloj: avanza el tiempo de la fase actual y salta a la siguiente al
  // agotarse. El efecto se recrea en cada fase, así que la duración nunca es
  // obsoleta y no hace falta una ref.
  useEffect(() => {
    if (!reproduce) return;
    const inicio = performance.now();
    let saltado = false;
    const id = window.setInterval(() => {
      if (saltado) return;
      const trans = performance.now() - inicio;
      if (trans >= fase.durMs) {
        saltado = true;
        setIndice((i) => (i + 1) % FASES_ACCESO.length);
        setTranscurrido(0);
      } else {
        setTranscurrido(trans);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [reproduce, fase.durMs, indice]);

  // Al entrar en una fase que lo pide, el panel pulsa una vez: es el reemplazo
  // accesible del sonido de aviso, y por eso respeta movimiento reducido.
  useEffect(() => {
    if (movimientoReducido || !fase.pulsa || !panelRef.current) return;
    const nodo = panelRef.current;
    nodo.classList.remove('alerta-visual');
    void nodo.offsetWidth;
    nodo.classList.add('alerta-visual');
  }, [indice, fase.pulsa, movimientoReducido]);

  function irAFase(i: number) {
    setAuto(false);
    setIndice(i);
    setTranscurrido(0);
  }

  const transcurridoEfectivo = reproduce ? transcurrido : Math.round(fase.durMs * 0.5);
  const { cuenta, progreso } = relojDeFase(fase, transcurridoEfectivo);
  const titular = fase.reloj === 'cuenta-corta' ? `${fase.titular} ${cuenta}` : fase.titular;

  return (
    <SeccionLanding id="acceso">
      <Revelar className="max-w-[44ch]">
        <RotuloSeccion color="attention">La regla del producto, hecha interfaz</RotuloSeccion>
        <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance">
          El enlace aparece 30 minutos antes. Solo en tu pantalla.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground text-pretty">
          La ventana de acceso tiene cinco fases. Esto es lo que ve el estudiante en cada una.
        </p>
      </Revelar>

      <Revelar retraso={80} className="mt-11 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="mb-3 font-mono text-xs tracking-wide text-muted-foreground">
            Las cinco fases
          </p>
          <ol className="grid gap-1.5">
            {FASES_ACCESO.map((f, i) => {
              const activa = i === indice;
              const Icono = f.icon;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    aria-current={activa ? 'step' : undefined}
                    onClick={() => irAFase(i)}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-base transition-colors duration-200 ease-suave',
                      activa
                        ? 'border-primary bg-primary-soft font-medium text-primary-soft-foreground'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="w-4 font-mono text-xs text-muted-foreground"
                    >
                      {f.paso}
                    </span>
                    <Icono aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
                    <span className="flex-1">{f.nombre}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Con movimiento reducido la demostración no se reproduce sola; se
              recorre fase por fase con los botones de arriba. */}
          {!movimientoReducido && (
            <Button
              variant="outline"
              onClick={() => setAuto((valor) => !valor)}
              className="mt-3.5 h-11 gap-2 px-4 text-sm"
            >
              {reproduce ? (
                <>
                  <Pause aria-hidden="true" strokeWidth={2} className="size-4" />
                  Pausar la demostración
                </>
              ) : (
                <>
                  <Play aria-hidden="true" strokeWidth={2} className="size-4" />
                  Reproducir la demostración
                </>
              )}
            </Button>
          )}
        </div>

        <div>
          <div className="relative overflow-hidden rounded-xl border border-border">
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-y-0 left-0 z-10 w-1 transition-colors duration-500 ease-suave',
                RIEL[fase.tono],
              )}
            />
            <div
              ref={panelRef}
              className={cn('p-6 pl-7 transition-colors duration-500 ease-suave', PANEL[fase.tono])}
            >
              <p className="sr-only" aria-live="polite">
                {fase.fase}
              </p>
              <p
                aria-hidden="true"
                className="flex items-center gap-2.5 text-sm font-medium tracking-wide"
              >
                <IconoFase aria-hidden="true" strokeWidth={2} className="size-5" />
                {fase.fase}
              </p>
              <h3 className="mt-3 text-2xl font-medium tracking-tight tabular-nums">{titular}</h3>
              <p className="mt-2.5 max-w-[46ch] text-base leading-relaxed">{fase.cuerpo}</p>

              {fase.reloj === 'cuenta-larga' && (
                <p className="mt-5 font-mono text-4xl tracking-tight tabular-nums">
                  <span className="sr-only">El acceso abre en </span>
                  {cuenta}
                </p>
              )}

              {fase.reloj === 'cuenta-corta' && (
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progreso}
                  aria-label="Tiempo restante para que abra el acceso"
                  className="mt-4 h-2 overflow-hidden rounded-full bg-foreground/10"
                >
                  <span
                    aria-hidden="true"
                    className="block h-full bg-attention transition-[width] duration-150 ease-linear"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              )}

              {fase.reloj === 'boton' && (
                <button
                  type="button"
                  className="mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-lg border border-transparent bg-foreground text-lg font-medium text-background transition-transform duration-200 ease-suave hover:-translate-y-px"
                >
                  <ExternalLink aria-hidden="true" strokeWidth={2} className="size-5" />
                  Entrar a la clase
                </button>
              )}
            </div>
          </div>
          <p className="mt-3.5 max-w-[52ch] text-sm text-muted-foreground text-pretty">
            Cuando el acceso abre, el panel pulsa una vez. Es el reemplazo del sonido de aviso: nada
            en la plataforma depende de oír.
          </p>
        </div>
      </Revelar>
    </SeccionLanding>
  );
}
