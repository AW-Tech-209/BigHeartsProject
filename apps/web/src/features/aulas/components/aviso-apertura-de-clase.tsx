import { DoorOpen } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { useAvisoApertura } from '@/features/aulas/hooks/use-aviso-apertura';
import { registrarNavegacion } from '@/features/aulas/lib/notificacion-navegador';
import { useAvisoAperturaStore } from '@/stores/aviso-apertura-store';

const FAVICON_CON_AVISO = '/favicon-aviso.svg';

/**
 * El aviso de que la clase ya abrió, dentro de la app: un `<Callout>` con
 * `alerta-visual` y, fuera de ella, el favicon con marca (el título lo pone
 * `usePageTitle`). Se monta en `<AppShell>` solo para estudiantes.
 */
export function AvisoAperturaDeClase() {
  useAvisoApertura();

  const aviso = useAvisoAperturaStore((s) => s.aviso);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const enElDetalle = aviso !== null && pathname === `/aulas/${aviso.classroomId}`;

  useEffect(() => {
    registrarNavegacion((ruta) => navigate(ruta));
    return () => registrarNavegacion(null);
  }, [navigate]);

  // Entrar al detalle de esa clase o que esta termine devuelve todo a la normalidad.
  useEffect(() => {
    if (!aviso) return;
    if (enElDetalle) {
      useAvisoAperturaStore.getState().descartar();
      return;
    }
    const espera = new Date(aviso.terminaEn).getTime() - Date.now();
    const temporizador = window.setTimeout(
      () => useAvisoAperturaStore.getState().descartar(),
      Math.max(espera, 0),
    );
    return () => window.clearTimeout(temporizador);
  }, [aviso, enElDetalle]);

  const hayAviso = aviso !== null;
  useEffect(() => {
    if (!hayAviso) return;
    const enlace = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!enlace) return;
    const original = enlace.getAttribute('href');
    enlace.setAttribute('href', FAVICON_CON_AVISO);
    return () => {
      if (original) enlace.setAttribute('href', original);
    };
  }, [hayAviso]);

  if (!aviso || enElDetalle) return null;

  return (
    // La sombra de `alerta-visual` va en un envoltorio: `<Callout>` ya anima su entrada.
    <div className="alerta-visual rounded-xl [animation-iteration-count:1]">
      <Callout
        variant="attention"
        live="polite"
        icon={DoorOpen}
        title={`Tu clase ${aviso.titulo} ya abrió`}
      >
        <Button
          render={<Link to={`/aulas/${aviso.classroomId}`} />}
          className="mt-2 h-11 gap-2 px-5 text-base"
        >
          Ir a la clase
        </Button>
      </Callout>
    </div>
  );
}
