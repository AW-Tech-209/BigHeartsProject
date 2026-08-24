import type { ClassroomLeadTimeWarningDetails } from '@academia/types';
import { Clock, LoaderCircle } from 'lucide-react';
import { type RefObject, useRef } from 'react';

import {
  AlertDialog,
  AlertDialogAcciones,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { describirDuracion } from '../lib/horario';

type DialogoPocaAntelacionProps = {
  /**
   * Los dos números del último aviso, o `null` mientras no ha llegado ninguno.
   *
   * **No se vacía al cerrar**, y por eso el estado de apertura viaja aparte: el
   * diálogo sigue pintándose durante su transición de salida, y un `aviso` que
   * volviera a `null` en el mismo instante en que se decide lo dejaría
   * despidiéndose vacío.
   */
  aviso: ClassroomLeadTimeWarningDetails | null;
  /** Si el diálogo está abierto. Lo abre la respuesta del servidor, nadie más. */
  abierto: boolean;
  /** Título que el profesor tecleó. El diálogo nombra el objeto, no dice «esta clase». */
  titulo: string;
  /** `true` mientras el reintento confirmado está en vuelo. Bloquea el cierre. */
  publicando: boolean;
  /** Reenvía la misma petición con `confirmarPocaAntelacion: true`. */
  onPublicar: () => void;
  /** Cierra sin publicar: el profesor vuelve al formulario a mover la hora. */
  onCambiarHora: () => void;
  /** Campo al que vuelve el foco al cerrar: el que hay que cambiar. */
  volverAlHorario: RefObject<HTMLInputElement | null>;
};

/**
 * El aviso de poca antelación, confirmable (HU-212, T8, AC7).
 *
 * **Es el único diálogo del repo que no abre el usuario.** Lo abre una respuesta
 * `CLASSROOM_LEAD_TIME_WARNING` del servidor, así que no tiene `Trigger`: el
 * profesor pulsó «Publicar la clase» y lo que recibe es una pregunta, no un
 * error. Por eso los dos botones son verbos y ninguno es «Aceptar» — a estas
 * alturas «Aceptar» sería ambiguo entre aceptar el aviso y aceptar publicar.
 *
 * Y por eso es un `AlertDialog` y no un `Callout` en la página: el envío ya
 * ocurrió y hay que decidir antes de seguir. Un aviso pasivo se podría no ver,
 * y en este producto no hay ningún sonido que lo respalde.
 *
 * El foco inicial va a **«Cambiar la hora»**, el botón seguro: publicar una
 * clase que nadie va a poder reservar es el error caro de esta pantalla.
 */
export function DialogoPocaAntelacion({
  aviso,
  abierto,
  titulo,
  publicando,
  onPublicar,
  onCambiarHora,
  volverAlHorario,
}: DialogoPocaAntelacionProps) {
  const cambiarRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(siguiente) => {
        // Solo se abre desde la respuesta del servidor; y no se cierra con la
        // petición en vuelo, para que el estado de carga no viva detrás de un
        // diálogo que acaba de desaparecer.
        if (siguiente || publicando) return;
        onCambiarHora();
      }}
    >
      <AlertDialogContent
        initialFocus={cambiarRef}
        // Función y no la ref a secas: si el aula se publicó, la pantalla ya ha
        // navegado y `<PaginaCabecera>` está moviendo el foco a su `<h1>`.
        // Devolverlo aquí a un input desmontado se lo robaría a mitad de camino.
        finalFocus={() => (volverAlHorario.current?.isConnected ? volverAlHorario.current : false)}
      >
        <AlertDialogTitle className="flex items-start gap-2.5">
          {/* Ámbar y reloj: en este producto el color no decora, y el ámbar
              significa siempre tiempo. El texto dice lo mismo por su cuenta.
              El token es el `-soft-foreground` y no `--attention` a secas: el
              ámbar pleno está pensado para rellenar, y sobre el fondo del
              popover no llega al 3:1 que exige un gráfico con significado. */}
          <Clock
            aria-hidden="true"
            strokeWidth={2}
            className="mt-1 size-6 shrink-0 text-attention-soft-foreground"
          />
          <span>
            «{titulo}» empieza en {describirAntelacion(aviso?.minutosDeAntelacion ?? 0)}
          </span>
        </AlertDialogTitle>

        <AlertDialogDescription
          // `render` y no `<p>` anidados: la descripción accesible del diálogo
          // es este bloque entero, y un `<p>` dentro de otro `<p>` lo partiría.
          render={<div />}
          className="space-y-2"
        >
          <span className="block">
            Tus estudiantes recibirán el recordatorio tarde, o no lo recibirán.
          </span>
          <span className="block">
            Con menos de {describirDuracion(aviso?.minimoMinutos ?? 0)} de antelación, muchos no
            verán la clase a tiempo para reservar su cupo.
          </span>
        </AlertDialogDescription>

        <AlertDialogAcciones>
          <AlertDialogClose
            render={<Button variant="outline" ref={cambiarRef} className="h-11 px-5 text-base" />}
            disabled={publicando}
          >
            Cambiar la hora
          </AlertDialogClose>

          <Button
            onClick={onPublicar}
            disabled={publicando}
            className="h-11 gap-2 px-5 text-base"
            // Este botón publica: el ámbar del título ya dijo que hay que
            // mirarlo, y el verbo dice exactamente qué pasa al pulsarlo.
          >
            {publicando ? (
              <>
                <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
                Publicando la clase…
              </>
            ) : (
              'Publicar de todas formas'
            )}
          </Button>
        </AlertDialogAcciones>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * `45 minutos`, `1 hora`… y `menos de un minuto` cuando ya no queda nada.
 *
 * El caso de cero no es teórico: el reloj que cuenta es el del servidor (§4.7) y
 * el profesor pudo tardar en enviar el formulario. `0 minutos` en mitad de la
 * frase se lee como un error de la pantalla, no como lo que es.
 */
function describirAntelacion(minutos: number): string {
  return minutos < 1 ? 'menos de un minuto' : describirDuracion(minutos);
}
