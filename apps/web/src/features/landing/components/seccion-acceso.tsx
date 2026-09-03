import { ExternalLink, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FASES_ACCESO, faseAccesoEn, type TonoFase } from '../lib/fases-acceso';
import { useMovimientoReducido } from '../lib/use-movimiento-reducido';
import { RotuloSeccion, SeccionLanding } from './primitivos-landing';

const MS_POR_FASE = 4500;

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
  const panelRef = useRef<HTMLDivElement>(null);

  const enPausa = auto && !movimientoReducido ? false : true;
  const fase = faseAccesoEn(indice);
  const IconoFase = fase.icon;

  useEffect(() => {
    if (enPausa) return;
    const id = window.setInterval(
      () => setIndice((actual) => (actual + 1) % FASES_ACCESO.length),
      MS_POR_FASE,
    );
    return () => window.clearInterval(id);
  }, [enPausa]);

  // Cuando el acceso se acerca o abre, el panel pulsa una vez: es el reemplazo
  // accesible del sonido de aviso, y por eso respeta movimiento reducido.
  useEffect(() => {
    if (movimientoReducido || !fase.pulsa || !panelRef.current) return;
    const nodo = panelRef.current;
    nodo.classList.remove('alerta-visual');
    void nodo.offsetWidth;
    nodo.classList.add('alerta-visual');
  }, [indice, fase.pulsa, movimientoReducido]);

  return (
    <SeccionLanding id="acceso">
      <div className="max-w-[44ch]">
        <RotuloSeccion color="attention">La regla del producto, hecha interfaz</RotuloSeccion>
        <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance">
          El enlace aparece 30 minutos antes. Solo en tu pantalla.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground text-pretty">
          La ventana de acceso tiene cinco fases. Esto es lo que ve el estudiante en cada una.
        </p>
      </div>

      <div className="mt-11 grid gap-8 lg:grid-cols-2 lg:items-start">
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
                    onClick={() => {
                      setAuto(false);
                      setIndice(i);
                    }}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-base transition-colors',
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
              recorre fase por fase con los botones de arriba, así que este
              control sobra. */}
          {!movimientoReducido && (
            <Button
              variant="outline"
              onClick={() => setAuto((valor) => !valor)}
              className="mt-3.5 h-11 gap-2 px-4 text-sm"
            >
              {enPausa ? (
                <>
                  <Play aria-hidden="true" strokeWidth={2} className="size-4" />
                  Reproducir la demostración
                </>
              ) : (
                <>
                  <Pause aria-hidden="true" strokeWidth={2} className="size-4" />
                  Pausar la demostración
                </>
              )}
            </Button>
          )}
        </div>

        <div>
          <div className="relative overflow-hidden rounded-xl border border-border">
            <span
              aria-hidden="true"
              className={cn('absolute inset-y-0 left-0 z-10 w-1', RIEL[fase.tono])}
            />
            <div ref={panelRef} className={cn('p-6 pl-7', PANEL[fase.tono])}>
              <p className="flex items-center gap-2.5 text-sm font-medium tracking-wide">
                <IconoFase aria-hidden="true" strokeWidth={2} className="size-5" />
                {fase.fase}
              </p>
              <h3 className="mt-3 text-2xl font-medium tracking-tight">{fase.titular}</h3>
              <p className="mt-2.5 max-w-[46ch] text-base leading-relaxed">{fase.cuerpo}</p>

              {fase.extra.tipo === 'contador' && (
                <p className="mt-5 font-mono text-4xl tracking-tight tabular-nums">
                  <span className="sr-only">El acceso abre en </span>
                  {fase.extra.valor}
                </p>
              )}

              {fase.extra.tipo === 'barra' && (
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={fase.extra.progreso}
                  aria-label="Tiempo restante para que abra el acceso"
                  className="mt-4 h-2 overflow-hidden rounded-full bg-foreground/10"
                >
                  <span
                    aria-hidden="true"
                    className="block h-full bg-attention"
                    style={{ width: `${fase.extra.progreso}%` }}
                  />
                </div>
              )}

              {fase.extra.tipo === 'boton' && (
                <button
                  type="button"
                  className="mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-lg border border-transparent bg-foreground text-lg font-medium text-background"
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
      </div>
    </SeccionLanding>
  );
}
