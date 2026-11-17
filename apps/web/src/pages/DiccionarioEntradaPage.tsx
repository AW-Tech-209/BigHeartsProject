import { ApiErrorCode } from '@academia/types';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FichaEntrada } from '@/features/diccionario/components/ficha-entrada';
import { Migas } from '@/features/diccionario/components/migas';
import { NavEntradas } from '@/features/diccionario/components/nav-entradas';
import { ReproductorSena } from '@/features/diccionario/components/reproductor-sena';
import { SenaEnGrabacion } from '@/features/diccionario/components/sena-en-grabacion';
import { useEntrada } from '@/features/diccionario/hooks/use-diccionario';
import { registrarReciente } from '@/features/diccionario/lib/recientes';
import { useEsMovil } from '@/hooks/use-es-movil';
import { ApiClientError } from '@/lib/api-error';

function esCampoDeTexto(elemento: EventTarget | null): boolean {
  if (!(elemento instanceof HTMLElement)) return false;
  return elemento.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(elemento.tagName);
}

export function DiccionarioEntradaPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const esMovil = useEsMovil();
  const entrada = useEntrada(slug);
  const datos = entrada.data;

  useEffect(() => {
    if (!datos) return;
    registrarReciente({
      slug: datos.slug,
      ingles: datos.ingles,
      espanol: datos.espanol,
      modulo: datos.modulo.numero,
      tramo: datos.modulo.tramo,
      categoria: datos.categoria.nombre,
      icono: datos.categoria.icono,
    });
  }, [datos]);

  // ← → navegan entre entradas; el listener vive solo mientras esta página está montada.
  useEffect(() => {
    function alPulsar(evento: KeyboardEvent) {
      if (evento.defaultPrevented || evento.ctrlKey || evento.metaKey || evento.altKey) return;
      if (esCampoDeTexto(evento.target) || !datos) return;
      const vecina =
        evento.key === 'ArrowLeft'
          ? datos.anterior
          : evento.key === 'ArrowRight'
            ? datos.siguiente
            : null;
      if (!vecina) return;
      evento.preventDefault();
      navigate(`/diccionario/entrada/${vecina.slug}`);
    }
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [datos, navigate]);

  if (!datos) {
    const noExiste =
      entrada.error instanceof ApiClientError &&
      entrada.error.code === ApiErrorCode.ENTRY_NOT_FOUND;
    return (
      <AppShell>
        <Migas pasos={[{ texto: 'Diccionario', to: '/diccionario' }, { texto: 'Entrada' }]} />
        {entrada.isError ? (
          <>
            <PaginaCabecera titulo="Entrada" tituloDocumento="Entrada · Diccionario" />
            {noExiste ? (
              <EstadoVacio
                ilustracion="no-encontrado"
                titular="No encontramos esta palabra."
                ayuda="Puede que la hayan quitado del diccionario. Búscala de nuevo desde el inicio."
                accion={
                  <Button
                    render={<Link to="/diccionario" />}
                    variant="outline"
                    className="h-11 px-4"
                  >
                    Ir al diccionario
                  </Button>
                }
              />
            ) : (
              <EstadoVacio
                ilustracion="error"
                titular="No pudimos cargar la palabra."
                ayuda="Revisa tu conexión e inténtalo de nuevo."
                accion={
                  <Button
                    variant="outline"
                    className="h-11 px-4"
                    onClick={() => void entrada.refetch()}
                  >
                    Reintentar
                  </Button>
                }
              />
            )}
          </>
        ) : (
          <div role="status" className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <span className="sr-only">Cargando la palabra…</span>
            <Skeleton className="aspect-video" />
            <Skeleton className="h-96" />
          </div>
        )}
      </AppShell>
    );
  }

  const rutaCategoria = `/diccionario/modulo/${datos.modulo.numero}/${datos.categoria.slug}`;
  const { actual, total } = datos.posicion;

  return (
    <AppShell conDock={esMovil}>
      <Migas
        pasos={[
          { texto: 'Diccionario', to: '/diccionario' },
          {
            texto: `Módulo ${datos.modulo.numero}`,
            to: `/diccionario/modulo/${datos.modulo.numero}`,
          },
          { texto: datos.categoria.nombre, to: rutaCategoria },
          { texto: datos.ingles },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={rutaCategoria}
          className="inline-flex min-h-11 items-center gap-2 text-base font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden="true" strokeWidth={2} className="size-4" />
          Volver a {datos.categoria.nombre}
        </Link>
        <p className="text-base font-medium">
          Entrada {actual} de {total} en {datos.categoria.nombre}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        {datos.sena.url ? (
          <ReproductorSena
            key={datos.slug}
            url={datos.sena.url}
            poster={datos.sena.miniaturaUrl}
            ingles={datos.ingles}
          />
        ) : (
          <SenaEnGrabacion
            categoria={datos.categoria.nombre}
            to={`${rutaCategoria}?conSena=true`}
          />
        )}
        <FichaEntrada entrada={datos} />
      </div>

      <NavEntradas
        anterior={datos.anterior}
        siguiente={datos.siguiente}
        posicion={datos.posicion}
        tramo={datos.modulo.tramo}
      />
    </AppShell>
  );
}
