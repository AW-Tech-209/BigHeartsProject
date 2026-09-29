import { Bell } from 'lucide-react';
import { useState } from 'react';

import { Callout } from '@/components/ui/callout';
import { SwitchField } from '@/components/ui/switch';
import {
  navegadorSoportaNotificaciones,
  pedirPermisoDeNotificacion,
} from '@/features/aulas/lib/notificacion-navegador';
import { useAvisoAperturaStore } from '@/stores/aviso-apertura-store';

const EXPLICACION = {
  denegado:
    'El navegador tiene bloqueadas las notificaciones de BigHearts. Para reactivarlas, abre los permisos del sitio (el candado junto a la dirección), permite Notificaciones y vuelve a activar este interruptor.',
  'no-soportado':
    'Tu navegador no admite notificaciones. Seguirás viendo el aviso en la pestaña y dentro de BigHearts.',
} as const;

/**
 * El permiso del navegador se pide **solo aquí**, al activar el interruptor:
 * pedirlo al cargar la página es la forma más segura de que lo denieguen.
 */
export function InterruptorAvisoNavegador() {
  const preferencia = useAvisoAperturaStore((s) => s.notificarEnNavegador);
  const guardar = useAvisoAperturaStore((s) => s.setNotificarEnNavegador);
  const [problema, setProblema] = useState<keyof typeof EXPLICACION | null>(null);

  const concedido = navegadorSoportaNotificaciones() && Notification.permission === 'granted';

  async function cambiar(activar: boolean) {
    if (!activar) {
      guardar(false);
      setProblema(null);
      return;
    }
    const resultado = await pedirPermisoDeNotificacion();
    guardar(resultado === 'concedido');
    setProblema(resultado === 'concedido' ? null : resultado);
  }

  return (
    <div className="space-y-3">
      <SwitchField
        id="avisar-en-navegador"
        label="Avisarme en el navegador cuando se abra mi clase"
        icon={Bell}
        checked={preferencia && concedido}
        onChange={(activar) => void cambiar(activar)}
      />
      {problema && (
        <Callout variant="attention" live="polite" title="No pudimos activar las notificaciones">
          <p>{EXPLICACION[problema]}</p>
        </Callout>
      )}
    </div>
  );
}
