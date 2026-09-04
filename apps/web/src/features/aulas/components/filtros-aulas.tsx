import {
  type CommunicationPreference,
  type EnglishLevel,
  type ListClassroomsQuery,
} from '@academia/types';
import { Presentation } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { SwitchField } from '@/components/ui/switch';
import { communicationPreferenceLabels } from '@/features/auth/lib/accessibility-labels';
import { hayFiltrosActivos } from '../lib/filtros-url';
import { nivelesDeIngles } from '../lib/niveles';

type FiltrosAulasProps = {
  value: ListClassroomsQuery;
  onChange: (query: ListClassroomsQuery) => void;
  /**
   * Si se ofrece la casilla `Solo mis clases` (HU-208, T4/AC5). Solo el
   * profesor tiene clases propias que separar del resto; para el estudiante y
   * el administrador el filtro devolvería siempre cero y no significa nada, así
   * que **no se pinta** — no se pinta deshabilitado.
   *
   * Llega resuelto desde la página, igual que `esMia` en la tarjeta: estos
   * componentes no leen la sesión.
   */
  ofreceSoloMisClases?: boolean;
};

/**
 * Filtros de nivel y rango de fechas (B4). Controles nativos (`<select>`,
 * `<input type="date">`): son los que se recorren con teclado sin construir
 * nada propio, y ya vienen anunciados por el lector de pantalla.
 *
 * Persistentes en la pantalla, nunca dentro de un desplegable
 * (`layout-y-composicion.md`). Al cambiar cualquier filtro, quita `page` del
 * query: la página 3 de un resultado que acaba de reducirse no tiene sentido.
 */
export function FiltrosAulas({ value, onChange, ofreceSoloMisClases = false }: FiltrosAulasProps) {
  const activos = hayFiltrosActivos(value);

  function actualizar(
    cambio: Partial<
      Pick<ListClassroomsQuery, 'level' | 'communicationMode' | 'desde' | 'hasta' | 'mias'>
    >,
  ) {
    const { page: _page, ...resto } = value;
    onChange({ ...resto, ...cambio });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-end gap-4">
        <Field id="filtro-nivel" label="Nivel" className="w-56">
          <NativeSelect
            value={value.level ?? ''}
            onChange={(event) =>
              actualizar({ level: (event.target.value || undefined) as EnglishLevel | undefined })
            }
          >
            <option value="">Todos los niveles</option>
            {Object.entries(nivelesDeIngles).map(([nivel, { nombre }]) => (
              <option key={nivel} value={nivel}>
                {nombre}
              </option>
            ))}
          </NativeSelect>
        </Field>

        {/* AC5: no viene puesto por defecto — «Todos los modos» es el valor inicial. */}
        <Field id="filtro-modo" label="Modo de comunicación" className="w-56">
          <NativeSelect
            value={value.communicationMode ?? ''}
            onChange={(event) =>
              actualizar({
                communicationMode: (event.target.value || undefined) as
                  CommunicationPreference | undefined,
              })
            }
          >
            <option value="">Todos los modos</option>
            {Object.entries(communicationPreferenceLabels).map(([modo, etiqueta]) => (
              <option key={modo} value={modo}>
                {etiqueta}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field id="filtro-desde" label="Desde">
          <Input
            type="date"
            value={value.desde ?? ''}
            onChange={(event) => actualizar({ desde: event.target.value || undefined })}
          />
        </Field>

        <Field id="filtro-hasta" label="Hasta">
          <Input
            type="date"
            value={value.hasta ?? ''}
            onChange={(event) => actualizar({ hasta: event.target.value || undefined })}
          />
        </Field>
      </div>

      {(ofreceSoloMisClases || activos) && (
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4">
          {/*
            AC5: solo para el profesor. Un interruptor y no un `<select>` porque
            es un sí/no, y va con su ícono (`Presentation`, el mismo que marca
            `Tu clase` en la tarjeta) para que el filtro y su resultado se lean
            como la misma cosa. `undefined` en vez de `false` al apagarlo: así
            desaparece de la URL en lugar de dejar un `mias=false` que no aporta
            nada.
          */}
          {ofreceSoloMisClases && (
            <SwitchField
              id="filtro-mias"
              label="Solo mis clases"
              icon={Presentation}
              checked={value.mias ?? false}
              onChange={(marcado) => actualizar({ mias: marcado || undefined })}
            />
          )}

          {/* AC del catálogo: quitar todos los filtros de un golpe, visible en
              cuanto hay alguno activo — no solo dentro del estado vacío. */}
          {activos && (
            <Button
              variant="outline"
              onClick={() => onChange({})}
              className="ml-auto h-11 px-4 text-sm"
            >
              Quitar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
