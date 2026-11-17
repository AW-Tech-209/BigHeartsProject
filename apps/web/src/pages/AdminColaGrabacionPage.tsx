import { useQueryClient } from '@tanstack/react-query';
import { CircleCheck, Download, FileVideo, Info, Pause, Play, Upload } from 'lucide-react';
import { type DragEvent, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import {
  AlertDialog,
  AlertDialogAcciones,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type {
  EntradaCola,
  MetaFila,
} from '@/features/admin/diccionario/components/fila-emparejamiento';
import { ListaSinSena } from '@/features/admin/diccionario/components/lista-sin-sena';
import { TablaEmparejamiento } from '@/features/admin/diccionario/components/tabla-emparejamiento';
import {
  useSinSena,
  useTodasLasEntradas,
} from '@/features/admin/diccionario/hooks/use-admin-diccionario';
import { ColaSubida, type FilaCola } from '@/features/admin/diccionario/lib/cola-subida';
import { csvSinSena } from '@/features/admin/diccionario/lib/csv-sin-sena';
import { emparejarArchivos } from '@/features/admin/diccionario/lib/emparejar-archivos';
import { subirSena } from '@/features/admin/diccionario/lib/subir-sena';
import { validarVideo } from '@/features/admin/diccionario/lib/validar-video';
import { Migas } from '@/features/diccionario/components/migas';
import { cn } from '@/lib/utils';

const INTERVALO_ANUNCIOS_MS = 5000;

function resumir(filas: FilaCola<MetaFila>[]) {
  const cuenta = (estados: string[]) => filas.filter((f) => estados.includes(f.estado)).length;
  return {
    total: filas.length,
    emparejados: filas.filter((f) => f.entradaId).length,
    sinEmparejar: cuenta(['sin-entrada']),
    conError: cuenta(['error']),
    listas: cuenta(['lista']),
    subiendo: cuenta(['subiendo', 'procesando']),
    pendientes: cuenta(['validando', 'en-espera', 'subiendo', 'procesando']),
  };
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function descargar(nombre: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export function AdminColaGrabacionPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const sinSena = useSinSena();
  const todas = useTodasLasEntradas();
  const entradas = useMemo<EntradaCola[]>(
    () => (todas.data ?? []).map((e) => ({ ...e, conSena: e.sena.estado === 'lista' })),
    [todas.data],
  );

  const [cola] = useState(
    () =>
      new ColaSubida<MetaFila>({
        validar: (archivo) => validarVideo(archivo),
        subir: subirSena,
        alTerminarUna: () => {
          void queryClient.invalidateQueries({ queryKey: ['admin-diccionario'] });
          void queryClient.invalidateQueries({ queryKey: ['diccionario'] });
        },
      }),
  );
  const filas = useSyncExternalStore(cola.suscribir, cola.obtener);
  const pausada = useSyncExternalStore(cola.suscribir, cola.estaPausada);
  const resumen = resumir(filas);
  const enCurso = resumen.pendientes > 0;
  const terminado = filas.length > 0 && !enCurso && resumen.sinEmparejar === 0;

  const selector = useRef<HTMLInputElement>(null);
  const refResumen = useRef<HTMLParagraphElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const [salirA, setSalirA] = useState<string | null>(null);
  const seguirAqui = useRef<HTMLButtonElement>(null);

  function agregar(lista: FileList | null) {
    const archivos = [...(lista ?? [])];
    if (archivos.length === 0) return;
    const emparejados = emparejarArchivos(
      archivos.map((a) => a.name),
      entradas,
    );
    cola.agregar(
      archivos.map((archivo, i) => {
        const emparejamiento = emparejados[i] ?? {
          estado: 'sin-emparejar' as const,
          sugerencia: null,
        };
        const entradaId =
          emparejamiento.estado === 'emparejada' || emparejamiento.estado === 'reemplaza'
            ? emparejamiento.entrada.id
            : null;
        return { archivo, entradaId, meta: { emparejamiento } };
      }),
    );
    requestAnimationFrame(() => refResumen.current?.focus());
  }

  // Anuncios agrupados: cada 5 s, y solo si algo cambió. Cada error se anuncia en su fila.
  const ultimo = useRef('');
  useEffect(() => {
    const id = setInterval(() => {
      const r = resumir(cola.obtener());
      if (r.total === 0) return;
      const texto = `${plural(r.listas, 'lista', 'listas')} · ${r.listas + r.conError} de ${r.total}`;
      if (texto !== ultimo.current) {
        ultimo.current = texto;
        setAnuncio(texto);
      }
    }, INTERVALO_ANUNCIOS_MS);
    return () => clearInterval(id);
  }, [cola]);

  // Salir con subidas en curso pregunta antes: enlaces de la app y cierre de la pestaña.
  useEffect(() => {
    if (!enCurso) return;
    function alClic(evento: MouseEvent) {
      const enlace = (evento.target as HTMLElement | null)?.closest('a[href]');
      if (!(enlace instanceof HTMLAnchorElement) || enlace.target || enlace.download) return;
      const url = new URL(enlace.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      evento.preventDefault();
      evento.stopPropagation();
      setSalirA(url.pathname + url.search);
    }
    function alCerrar(evento: BeforeUnloadEvent) {
      evento.preventDefault();
    }
    document.addEventListener('click', alClic, true);
    window.addEventListener('beforeunload', alCerrar);
    return () => {
      document.removeEventListener('click', alClic, true);
      window.removeEventListener('beforeunload', alCerrar);
    };
  }, [enCurso]);

  const filasVisibles = terminado ? filas.filter((f) => f.estado === 'error') : filas;
  const sinSenaTotal = sinSena.data?.entradas.length;

  return (
    <AppShell>
      <Migas
        pasos={[{ texto: 'Diccionario', to: '/admin/diccionario' }, { texto: 'Cola de grabación' }]}
      />
      <PaginaCabecera
        titulo="Cola de grabación"
        tituloDocumento="Cola de grabación · Diccionario"
        contexto={`${sinSenaTotal !== undefined ? `${plural(sinSenaTotal, 'entrada todavía no tiene', 'entradas todavía no tienen')} seña lista. ` : ''}Nombra cada video como la palabra y súbelos juntos.`}
        accion={
          <Button
            variant="outline"
            disabled={!sinSena.data}
            className="h-12 gap-2 px-5 text-base"
            onClick={() =>
              sinSena.data && descargar('sin-sena.csv', csvSinSena(sinSena.data.entradas))
            }
          >
            <Download aria-hidden="true" strokeWidth={2} className="size-5" />
            Descargar lista de nombres
          </Button>
        }
      />

      <p role="status" className="sr-only">
        {anuncio}
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section aria-labelledby="titulo-subir" className="space-y-4">
          <h2 id="titulo-subir" className="text-xl font-semibold">
            Subir videos
          </h2>
          <input
            ref={selector}
            type="file"
            accept="video/mp4"
            multiple
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={(e) => {
              agregar(e.target.files);
              e.target.value = '';
            }}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              setArrastrando(false);
              agregar(e.dataTransfer.files);
            }}
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transicion-rapida',
              arrastrando
                ? 'border-primary bg-primary-soft'
                : 'border-muted-foreground/40 bg-muted/40',
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-full border border-border bg-background">
              <Upload aria-hidden="true" strokeWidth={2} className="size-5" />
            </span>
            <p className="text-lg font-semibold">
              {arrastrando
                ? 'Suelta los videos aquí'
                : filas.length
                  ? 'Suelta más videos aquí'
                  : 'Arrastra los videos aquí'}
            </p>
            <Button
              variant="outline"
              disabled={!todas.data}
              className="h-11 gap-2 px-4 text-base"
              onClick={() => selector.current?.click()}
            >
              <FileVideo aria-hidden="true" strokeWidth={2} className="size-4" />
              Elegir videos
            </Button>
            <p className="max-w-[60ch] text-sm text-muted-foreground">
              {todas.data
                ? 'Nombre del archivo = la palabra en inglés, con guiones: to-eat.mp4 → «To eat». MP4 de 2 a 15 segundos, sin audio.'
                : 'Cargando las entradas para poder emparejar los archivos…'}
            </p>
          </div>

          {filas.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p ref={refResumen} tabIndex={-1} role="status" className="text-base outline-none">
                  <strong>{plural(resumen.total, 'archivo', 'archivos')}</strong> ·{' '}
                  {plural(resumen.emparejados, 'emparejado', 'emparejados')} ·{' '}
                  {resumen.sinEmparejar} sin emparejar · {resumen.conError} con error
                </p>
                {enCurso && (
                  <p className="text-base text-muted-foreground">
                    {pausada
                      ? 'Subida en pausa'
                      : `Subiendo ${resumen.subiendo} de ${resumen.pendientes} · los demás esperan`}
                  </p>
                )}
              </div>

              {resumen.sinEmparejar > 0 && (
                <p className="flex items-start gap-2 rounded-xl border border-info/30 bg-info-soft p-4 text-base text-info-soft-foreground">
                  <Info aria-hidden="true" strokeWidth={2} className="mt-0.5 size-5 shrink-0" />
                  <span>
                    <strong>
                      {plural(
                        resumen.sinEmparejar,
                        'archivo sin emparejar',
                        'archivos sin emparejar',
                      )}
                      .
                    </strong>{' '}
                    Elige su entrada en la lista. Hasta entonces no se suben.
                  </span>
                </p>
              )}

              {terminado && (
                <div className="space-y-1 rounded-xl border border-success-border bg-success-soft p-4 text-success-soft-foreground">
                  <p className="flex items-center gap-2 text-lg font-semibold">
                    <CircleCheck aria-hidden="true" strokeWidth={2} className="size-5" />
                    {plural(resumen.listas, 'lista', 'listas')} · {resumen.conError} con error
                  </p>
                  <p className="text-base">
                    {resumen.listas > 0 &&
                      `Las ${plural(resumen.listas, 'seña', 'señas')} ya se ven en el diccionario. `}
                    {resumen.conError > 0 && 'Corrige los archivos de abajo y súbelos otra vez.'}
                  </p>
                </div>
              )}

              {filasVisibles.length > 0 && (
                <TablaEmparejamiento
                  filas={filasVisibles}
                  entradas={entradas}
                  onAsignar={(id, entrada) => cola.asignar(id, entrada.id)}
                  onReemplazarArchivo={(id, archivo) => cola.reemplazarArchivo(id, archivo)}
                />
              )}

              <div className="flex flex-wrap justify-end gap-3">
                {enCurso ? (
                  <>
                    <Button
                      variant="ghost"
                      className="h-11 px-4 text-base text-primary"
                      onClick={() => cola.cancelarTodo()}
                    >
                      Cancelar todo
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 gap-2 px-4 text-base"
                      onClick={() => (pausada ? cola.reanudar() : cola.pausar())}
                    >
                      {pausada ? (
                        <Play aria-hidden="true" strokeWidth={2} className="size-4" />
                      ) : (
                        <Pause aria-hidden="true" strokeWidth={2} className="size-4" />
                      )}
                      {pausada ? 'Reanudar subida' : 'Pausar subida'}
                    </Button>
                  </>
                ) : (
                  terminado && (
                    <>
                      <Button
                        className="h-11 gap-2 px-4 text-base"
                        onClick={() => selector.current?.click()}
                      >
                        <Upload aria-hidden="true" strokeWidth={2} className="size-4" />
                        Subir más videos
                      </Button>
                      <Button
                        render={<Link to="/admin/diccionario" />}
                        variant="outline"
                        className="h-11 px-4 text-base"
                      >
                        Ver en la consola
                      </Button>
                    </>
                  )
                )}
              </div>
            </>
          )}
        </section>

        <ListaSinSena entradas={sinSena.data?.entradas ?? []} cargando={sinSena.isPending} />
      </div>

      <AlertDialog open={salirA !== null} onOpenChange={(abierto) => !abierto && setSalirA(null)}>
        <AlertDialogContent initialFocus={seguirAqui}>
          <AlertDialogTitle>
            {`Hay ${plural(resumen.pendientes, 'video subiendo', 'videos subiendo')}.`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Si sales, se cancelan y tendrás que subirlos otra vez.
          </AlertDialogDescription>
          <AlertDialogAcciones>
            <Button
              ref={seguirAqui}
              variant="outline"
              className="h-11 px-5 text-base"
              onClick={() => setSalirA(null)}
            >
              Seguir aquí
            </Button>
            <Button
              variant="destructive"
              className="h-11 px-5 text-base"
              onClick={() => {
                const destino = salirA;
                cola.cancelarTodo();
                setSalirA(null);
                if (destino) navigate(destino);
              }}
            >
              Salir y cancelar
            </Button>
          </AlertDialogAcciones>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
