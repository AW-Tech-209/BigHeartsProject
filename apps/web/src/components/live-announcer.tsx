import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { AnnouncerContext } from './announcer-context';

/**
 * Monta UNA región viva `aria-live="polite"` (sr-only) en la raíz de la app
 * (§7.5 de la guía). Cualquier cambio importante que no sea un cambio de ruta
 * se anuncia aquí, para que un lector de pantalla lo lea sin mover el foco.
 */
export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timeout = useRef<number | undefined>(undefined);

  const announce = useCallback((next: string) => {
    // Limpiar y volver a poner obliga al lector a releer aunque el texto sea igual.
    setMessage('');
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setMessage(next), 60);
  }, []);

  // Sin esto, un `announce()` disparado justo antes de desmontar deja un
  // setTimeout vivo que intenta hacer setState tras el unmount — en tests eso
  // dispara después de que jsdom ya se destruyó (`window is not defined`).
  useEffect(() => () => window.clearTimeout(timeout.current), []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}
