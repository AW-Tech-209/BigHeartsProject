/**
 * Enlace "Saltar al contenido": primer elemento enfocable del documento,
 * invisible hasta recibir foco (§7.2 de la guía). Salta al `<main id="contenido">`.
 */
export function SkipLink() {
  return (
    <a
      href="#contenido"
      className="sr-only rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
    >
      Saltar al contenido
    </a>
  );
}
