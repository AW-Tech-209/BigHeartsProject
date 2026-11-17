import type { ReactNode } from 'react';

/** Texto en inglés: `lang="en"` para que el lector de pantalla lo pronuncie bien. */
export function Ingles({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span lang="en" className={className}>
      {children}
    </span>
  );
}
