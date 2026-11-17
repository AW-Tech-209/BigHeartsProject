import {
  type CategoriaAdmin,
  ESTADO_SENA_ADMIN_LABELS,
  ESTADOS_SENA_ADMIN,
  type EntradasAdminQuery,
  type EstadoSenaAdmin,
  type ModuloAdmin,
  TIPO_ENTRADA_LABELS,
  TipoEntrada,
} from '@academia/types';
import { Search, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ChipFiltro, GrupoFiltros } from '@/features/diccionario/components/chip-filtro';
import { SENA_ADMIN } from '@/features/diccionario/lib/sena-admin';
import { hayFiltrosConsola } from '../lib/filtros-consola';

type FiltrosConsolaProps = {
  filtros: EntradasAdminQuery;
  modulos: ModuloAdmin[];
  categorias: CategoriaAdmin[];
  conteosSena?: Record<EstadoSenaAdmin, number>;
  total?: number;
  onCambiar: (cambio: Partial<EntradasAdminQuery>) => void;
  onQuitar: () => void;
};

const ESPERA_BUSQUEDA_MS = 300;

export function FiltrosConsola({
  filtros,
  modulos,
  categorias,
  conteosSena,
  total,
  onCambiar,
  onQuitar,
}: FiltrosConsolaProps) {
  const id = useId();
  const [texto, setTexto] = useState(filtros.q ?? '');
  const [qAnterior, setQAnterior] = useState(filtros.q);
  if (qAnterior !== filtros.q) {
    setQAnterior(filtros.q);
    setTexto(filtros.q ?? '');
  }

  useEffect(() => {
    const limpio = texto.trim();
    if (limpio === (filtros.q ?? '')) return;
    const espera = setTimeout(() => onCambiar({ q: limpio || undefined }), ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [texto, filtros.q, onCambiar]);

  const modulo = modulos.find((m) => m.numero === filtros.modulo);
  const sumaSena = conteosSena
    ? ESTADOS_SENA_ADMIN.reduce((suma, estado) => suma + conteosSena[estado], 0)
    : 0;
  const resumen = [
    total !== undefined ? `${total} ${total === 1 ? 'entrada' : 'entradas'}` : null,
    modulo ? `Módulo ${modulo.numero}` : null,
    categorias.find((c) => c.slug === filtros.categoria)?.nombre,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(5,1fr)]">
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <label htmlFor={`${id}-q`} className="block text-base font-medium">
            Buscar
          </label>
          <Input
            id={`${id}-q`}
            type="search"
            iconoInicio={Search}
            placeholder="Inglés o español"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
          />
        </div>
        <Selector
          id={`${id}-modulo`}
          etiqueta="Módulo"
          valor={filtros.modulo ? String(filtros.modulo) : ''}
          onCambiar={(v) => onCambiar({ modulo: v ? Number(v) : undefined })}
          opciones={modulos.map((m) => ({ valor: String(m.numero), texto: `Módulo ${m.numero}` }))}
          todos="Todos"
        />
        <Selector
          id={`${id}-categoria`}
          etiqueta="Categoría"
          valor={filtros.categoria ?? ''}
          onCambiar={(v) => onCambiar({ categoria: v || undefined })}
          opciones={categorias.map((c) => ({ valor: c.slug, texto: c.nombre }))}
          todos="Todas"
        />
        <Selector
          id={`${id}-tipo`}
          etiqueta="Tipo"
          valor={filtros.tipo ?? ''}
          onCambiar={(v) => onCambiar({ tipo: (v || undefined) as TipoEntrada | undefined })}
          opciones={Object.values(TipoEntrada).map((t) => ({
            valor: t,
            texto: TIPO_ENTRADA_LABELS[t],
          }))}
          todos="Todos"
        />
        <Selector
          id={`${id}-unidad`}
          etiqueta="Unidad"
          valor={filtros.unidad ?? ''}
          onCambiar={(v) => onCambiar({ unidad: v || undefined })}
          opciones={(modulo?.unidades ?? []).map((u) => ({
            valor: u.codigo,
            texto: `Unidad ${u.codigo.slice(1)} · ${u.nombre}`,
          }))}
          todos={modulo ? 'Todas' : 'Elige un módulo para ver sus unidades'}
        />
        <Selector
          id={`${id}-imagen`}
          etiqueta="Imagen"
          valor={filtros.imagen ?? ''}
          onCambiar={(v) => onCambiar({ imagen: (v || undefined) as 'con' | 'sin' | undefined })}
          opciones={[
            { valor: 'con', texto: 'Con imagen' },
            { valor: 'sin', texto: 'Sin imagen' },
          ]}
          todos="Todas"
        />
      </div>

      <GrupoFiltros titulo="Seña">
        <ChipFiltro
          activo={!filtros.sena}
          conteo={sumaSena}
          onClick={() => onCambiar({ sena: undefined })}
        >
          Todas
        </ChipFiltro>
        {ESTADOS_SENA_ADMIN.map((estado) => {
          const Icono = SENA_ADMIN[estado].icono;
          return (
            <ChipFiltro
              key={estado}
              activo={filtros.sena === estado}
              conteo={conteosSena?.[estado] ?? 0}
              onClick={() => onCambiar({ sena: estado })}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icono aria-hidden="true" strokeWidth={2} className="size-4" />
                {ESTADO_SENA_ADMIN_LABELS[estado]}
              </span>
            </ChipFiltro>
          );
        })}
      </GrupoFiltros>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-base">
          {resumen}
        </p>
        {hayFiltrosConsola(filtros) && (
          <Button
            variant="ghost"
            onClick={onQuitar}
            className="h-11 gap-2 px-3 text-base text-primary"
          >
            <X aria-hidden="true" strokeWidth={2} className="size-4" />
            Quitar filtros
          </Button>
        )}
      </div>
    </div>
  );
}

function Selector({
  id,
  etiqueta,
  valor,
  opciones,
  todos,
  onCambiar,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  opciones: { valor: string; texto: string }[];
  todos: string;
  onCambiar: (valor: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block text-base font-medium">
        {etiqueta}
      </label>
      <NativeSelect id={id} value={valor} onChange={(evento) => onCambiar(evento.target.value)}>
        <option value="">{todos}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
