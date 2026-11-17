import { resaltar } from '../lib/resaltar';

/** La coincidencia va en negrita + subrayado: nunca solo con color. */
export function Resaltado({ texto, busqueda }: { texto: string; busqueda: string }) {
  return (
    <>
      {resaltar(texto, busqueda).map((s, i) =>
        s.coincide ? (
          <strong key={i} className="font-semibold underline decoration-2 underline-offset-4">
            {s.texto}
          </strong>
        ) : (
          <span key={i}>{s.texto}</span>
        ),
      )}
    </>
  );
}
