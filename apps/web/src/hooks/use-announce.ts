import { useContext } from 'react';

import { AnnouncerContext } from '@/components/announcer-context';

/** Devuelve la función `announce(mensaje)` de la región viva raíz. */
export function useAnnounce() {
  const context = useContext(AnnouncerContext);

  if (!context) {
    throw new Error('useAnnounce debe usarse dentro de <LiveAnnouncerProvider>.');
  }

  return context.announce;
}
