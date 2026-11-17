import { CircleAlert, Maximize, Minimize, Pause, Play, Repeat, Video } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useMovimientoReducido } from '@/hooks/use-movimiento-reducido';
import { cn } from '@/lib/utils';
import {
  formatoVelocidad,
  usePreferenciasReproductor,
  type Velocidad,
  VELOCIDADES,
} from '../hooks/use-preferencias-reproductor';

type Estado = 'reposo' | 'cargando' | 'reproduciendo' | 'pausa' | 'detenido' | 'error';

const VUELTAS_CON_MOVIMIENTO_REDUCIDO = 3;

type ReproductorSenaProps = {
  url: string;
  poster: string | null;
  ingles: string;
};

function esCampoDeTexto(elemento: EventTarget | null): boolean {
  if (!(elemento instanceof HTMLElement)) return false;
  return elemento.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(elemento.tagName);
}

function esControl(elemento: EventTarget | null): boolean {
  return elemento instanceof HTMLElement && elemento.closest('button, a, [role]') !== null;
}

/**
 * `<video>` nativo, mudo y sin `autoplay`: solo se reproduce cuando la persona lo pide.
 * El espejo invierte solo el video; los controles y su texto nunca.
 */
export function ReproductorSena({ url, poster, ingles }: ReproductorSenaProps) {
  const id = useId();
  const video = useRef<HTMLVideoElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const botonReproducir = useRef<HTMLButtonElement>(null);
  const botonPantalla = useRef<HTMLButtonElement>(null);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);
  const vueltas = useRef(0);

  const { velocidad, espejo, guardar } = usePreferenciasReproductor();
  const reducido = useMovimientoReducido();
  const [iniciado, setIniciado] = useState(false);
  const [estado, setEstado] = useState<Estado>('reposo');
  const [espera, setEspera] = useState<'no' | 'corta' | 'larga'>('no');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const enMarcha = estado === 'reproduciendo' || estado === 'cargando';

  function limpiarEspera() {
    temporizadores.current.forEach(clearTimeout);
    temporizadores.current = [];
    setEspera('no');
  }

  function esperarCarga() {
    limpiarEspera();
    temporizadores.current = [
      setTimeout(() => setEspera('corta'), 400),
      setTimeout(() => setEspera('larga'), 10_000),
    ];
  }

  function reproducir() {
    const v = video.current;
    if (!v) return;
    setIniciado(true);
    setMensaje(null);
    setEstado('cargando');
    if (estado !== 'pausa') vueltas.current = 0;
    esperarCarga();
    v.playbackRate = velocidad;
    void v.play()?.catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setEstado('error');
    });
  }

  function alternar() {
    if (enMarcha) video.current?.pause();
    else reproducir();
  }

  function verLaSena() {
    reproducir();
    botonReproducir.current?.focus();
  }

  function cambiarVelocidad(nueva: Velocidad) {
    guardar({ velocidad: nueva });
    if (video.current) video.current.playbackRate = nueva;
    setMensaje(`Velocidad ${formatoVelocidad(nueva)}.`);
  }

  function cambiarEspejo(activo: boolean) {
    guardar({ espejo: activo });
    setMensaje(activo ? 'Espejo activado.' : 'Espejo desactivado.');
  }

  function alternarPantallaCompleta() {
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void contenedor.current?.requestFullscreen?.();
  }

  function alTerminar() {
    vueltas.current += 1;
    if (vueltas.current < VUELTAS_CON_MOVIMIENTO_REDUCIDO) {
      void video.current?.play();
      return;
    }
    setEstado('detenido');
  }

  const acciones = useRef({
    alternar,
    cambiarVelocidad,
    cambiarEspejo,
    alternarPantallaCompleta,
    espejo,
  });
  useEffect(() => {
    acciones.current = {
      alternar,
      cambiarVelocidad,
      cambiarEspejo,
      alternarPantallaCompleta,
      espejo,
    };
  });

  useEffect(() => {
    function alPulsar(evento: globalThis.KeyboardEvent) {
      if (evento.defaultPrevented || evento.ctrlKey || evento.metaKey || evento.altKey) return;
      if (esCampoDeTexto(evento.target)) return;
      const a = acciones.current;
      const tecla = evento.key.toLowerCase();
      if (tecla === 'k' || (tecla === ' ' && !esControl(evento.target))) a.alternar();
      else if (tecla === '1' || tecla === '2' || tecla === '3')
        a.cambiarVelocidad(VELOCIDADES[Number(tecla) - 1] ?? 1);
      else if (tecla === 'e') a.cambiarEspejo(!a.espejo);
      else if (tecla === 'f') a.alternarPantallaCompleta();
      else return;
      evento.preventDefault();
    }
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, []);

  useEffect(() => {
    function alCambiar() {
      const activo = document.fullscreenElement === contenedor.current;
      setPantallaCompleta((antes) => {
        if (antes && !activo) botonPantalla.current?.focus();
        return activo;
      });
    }
    document.addEventListener('fullscreenchange', alCambiar);
    const pendientes = temporizadores.current;
    return () => {
      document.removeEventListener('fullscreenchange', alCambiar);
      pendientes.forEach(clearTimeout);
    };
  }, []);

  const linea =
    mensaje ??
    {
      reposo: 'Lista para ver. No se reproduce sola. Se repite en bucle.',
      cargando:
        espera === 'larga'
          ? 'Con conexión lenta puede tardar unos segundos.'
          : espera === 'corta'
            ? 'Cargando la seña…'
            : '',
      reproduciendo: `Reproduciendo en bucle · Velocidad ${formatoVelocidad(velocidad)}${espejo ? ' · espejo activado' : ''}`,
      pausa: 'En pausa.',
      detenido: `Se detuvo tras ${VUELTAS_CON_MOVIMIENTO_REDUCIDO} repeticiones. Pulsa Reproducir para verla otra vez.`,
      error: '',
    }[estado];

  return (
    <div
      ref={contenedor}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-xs [&:fullscreen]:flex [&:fullscreen]:flex-col [&:fullscreen]:rounded-none"
    >
      <div
        className={cn('relative aspect-video bg-muted', pantallaCompleta && 'aspect-auto flex-1')}
      >
        <video
          ref={video}
          src={url}
          poster={poster ?? undefined}
          muted
          playsInline
          loop={!reducido}
          preload="none"
          aria-label={`Seña en LSC de ${ingles}`}
          onClick={() => iniciado && alternar()}
          onPlaying={() => {
            limpiarEspera();
            setMensaje(null);
            setEstado('reproduciendo');
          }}
          onWaiting={() => {
            setEstado('cargando');
            esperarCarga();
          }}
          onPause={() => {
            limpiarEspera();
            setMensaje(null);
            setEstado((antes) => (antes === 'detenido' || antes === 'error' ? antes : 'pausa'));
          }}
          onEnded={reducido ? alTerminar : undefined}
          onError={() => {
            limpiarEspera();
            setEstado('error');
          }}
          className={cn('size-full object-contain', espejo && '-scale-x-100')}
        />
        {!iniciado && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={verLaSena}
              aria-label={`Ver la seña de ${ingles}`}
              className="h-14 gap-2 rounded-full px-7 text-lg shadow-lg"
            >
              <Play aria-hidden="true" strokeWidth={2} className="size-5" />
              Ver la seña
            </Button>
          </div>
        )}
      </div>

      <p
        aria-live="polite"
        className="flex min-h-11 items-center gap-2 border-y border-border px-4 py-2 text-base"
      >
        {estado === 'reposo' ? (
          <Video aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
        ) : (
          <Repeat aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
        )}
        <span>{linea}</span>
      </p>

      {estado === 'error' && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3"
        >
          <CircleAlert aria-hidden="true" strokeWidth={2} className="size-5 text-destructive" />
          <p className="flex-1 text-base">
            No pudimos cargar la seña. Revisa tu conexión e inténtalo otra vez.
          </p>
          <Button
            variant="outline"
            className="h-11 px-4"
            onClick={() => {
              video.current?.load();
              reproducir();
            }}
          >
            Reintentar
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 p-4">
        <Button
          ref={botonReproducir}
          variant="outline"
          onClick={alternar}
          className="h-12 gap-2 px-4 text-base"
        >
          {enMarcha ? (
            <Pause aria-hidden="true" strokeWidth={2} className="size-5" />
          ) : (
            <Play aria-hidden="true" strokeWidth={2} className="size-5" />
          )}
          {enMarcha ? 'Pausa' : 'Reproducir'}
        </Button>

        <SelectorVelocidad id={id} velocidad={velocidad} onCambiar={cambiarVelocidad} />

        <label className="flex min-h-12 cursor-pointer items-center gap-3 text-base">
          <Switch checked={espejo} onCheckedChange={cambiarEspejo} />
          Ver como en un espejo
        </label>

        <Button
          ref={botonPantalla}
          variant="outline"
          onClick={alternarPantallaCompleta}
          className="h-12 gap-2 px-4 text-base"
        >
          {pantallaCompleta ? (
            <Minimize aria-hidden="true" strokeWidth={2} className="size-5" />
          ) : (
            <Maximize aria-hidden="true" strokeWidth={2} className="size-5" />
          )}
          {pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
        </Button>
      </div>

      <p className="hidden border-t border-border px-4 py-3 text-sm text-muted-foreground lg:block">
        Atajos: <kbd className="rounded border px-1">Espacio</kbd> reproducir o pausar ·{' '}
        <kbd className="rounded border px-1">1</kbd> <kbd className="rounded border px-1">2</kbd>{' '}
        <kbd className="rounded border px-1">3</kbd> velocidad ·{' '}
        <kbd className="rounded border px-1">E</kbd> espejo ·{' '}
        <kbd className="rounded border px-1">F</kbd> pantalla completa ·{' '}
        <kbd className="rounded border px-1">←</kbd> <kbd className="rounded border px-1">→</kbd>{' '}
        anterior y siguiente
      </p>
    </div>
  );
}

function SelectorVelocidad({
  id,
  velocidad,
  onCambiar,
}: {
  id: string;
  velocidad: Velocidad;
  onCambiar: (velocidad: Velocidad) => void;
}) {
  const grupo = useRef<HTMLDivElement>(null);

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>) {
    const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[evento.key];
    if (!paso) return;
    // Dentro del grupo las flechas cambian la velocidad, no la entrada.
    evento.preventDefault();
    evento.stopPropagation();
    const i = VELOCIDADES.indexOf(velocidad);
    const siguiente = VELOCIDADES[(i + paso + VELOCIDADES.length) % VELOCIDADES.length] ?? 1;
    onCambiar(siguiente);
    grupo.current?.querySelector<HTMLElement>(`[data-velocidad="${siguiente}"]`)?.focus();
  }

  return (
    <div className="flex items-center gap-3">
      <span id={`${id}-velocidad`} className="text-base font-medium">
        Velocidad
      </span>
      <div
        ref={grupo}
        role="radiogroup"
        aria-labelledby={`${id}-velocidad`}
        onKeyDown={alTeclear}
        className="flex rounded-lg border border-border p-1"
      >
        {VELOCIDADES.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={v === velocidad}
            tabIndex={v === velocidad ? 0 : -1}
            data-velocidad={v}
            onClick={() => onCambiar(v)}
            className={cn(
              'min-h-10 min-w-14 rounded-md px-3 text-base transicion-rapida',
              v === velocidad ? 'bg-primary font-medium text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {formatoVelocidad(v)}
          </button>
        ))}
      </div>
    </div>
  );
}
