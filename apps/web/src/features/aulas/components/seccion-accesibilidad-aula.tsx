import { type CommunicationPreference } from '@academia/types';

import { CheckboxCardGroup, type CheckboxCardOption } from '@/components/ui/checkbox-card-group';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { APOYOS_AULA } from '../lib/apoyos-aula';
import {
  etiquetaModoComunicacion,
  iconoModoComunicacion,
  MODOS_COMUNICACION_EN_ORDEN,
} from '../lib/modos-comunicacion';

const OPCIONES_MODO: CheckboxCardOption<CommunicationPreference>[] =
  MODOS_COMUNICACION_EN_ORDEN.map((modo) => ({
    value: modo,
    label: etiquetaModoComunicacion[modo],
    icon: iconoModoComunicacion[modo],
  }));

export type ValoresAccesibilidadAula = {
  communicationModes: CommunicationPreference[];
  hasInterpreter: boolean;
  hasLiveCaptions: boolean;
  hasVisualMaterials: boolean;
};

type SeccionAccesibilidadAulaProps = {
  values: ValoresAccesibilidadAula;
  /**
   * Un `patch` parcial, no `(campo, valor)`: así el formulario que la monta
   * puede tipar su propio actualizador contra un objeto MÁS GRANDE
   * (`ClassroomFormValues`) sin que la varianza de una firma genérica
   * `<K>(field: K, value: T[K])` se lo impida — un patch es covariante donde
   * la pareja campo/valor no lo es.
   */
  onChange: (patch: Partial<ValoresAccesibilidadAula>) => void;
  /** Error de `communicationModes`, pintado bajo el grupo (AC1). */
  error?: string;
};

/**
 * Sección de accesibilidad compartida entre crear y completar un aula (T8):
 * los modos de comunicación —selección múltiple, obligatoria— y los tres
 * apoyos. Sin estado propio, para que los dos formularios no puedan
 * desincronizarse.
 *
 * El selector de plataforma de la videollamada (T9) NO vive aquí: va junto al
 * campo del enlace, que es donde lo pide la HU.
 */
export function SeccionAccesibilidadAula({
  values,
  onChange,
  error,
}: SeccionAccesibilidadAulaProps) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-border bg-muted/40 p-5">
      <legend className="px-1 text-base font-medium text-foreground">Accesibilidad</legend>

      {/*
        `id` + `tabIndex={-1}` en el bloque de modos: es lo que le da a
        `focusFirstError()` del formulario un sitio al que llevar el foco
        cuando el primer error es "elige al menos un modo" — el mismo patrón
        que un `<input id="fecha">`, pero aquí el control es un grupo, no un
        único elemento.
      */}
      <div
        id="communicationModes"
        tabIndex={-1}
        className="space-y-2 rounded-lg focus:ring-3 focus:ring-ring/50 focus:outline-none"
      >
        <p id="modos-comunicacion-heading" className="text-sm font-medium text-foreground">
          ¿En qué modos se imparte la clase?{' '}
          <span className="font-normal text-muted-foreground">(obligatorio)</span>
        </p>
        <p className="max-w-[65ch] text-sm text-muted-foreground">
          Elige todos los que apliquen. Una clase puede darse en lengua de señas y con subtítulos en
          vivo a la vez.
        </p>

        <CheckboxCardGroup
          labelledBy="modos-comunicacion-heading"
          options={OPCIONES_MODO}
          value={values.communicationModes}
          onChange={(modos) => onChange({ communicationModes: modos })}
        />

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Apoyos disponibles</p>
        <div className="space-y-2">
          {APOYOS_AULA.map(({ clave, etiqueta, icon }) => (
            <CheckboxField
              key={clave}
              id={clave}
              label={etiqueta}
              icon={icon}
              checked={values[clave]}
              onChange={(checked) => onChange({ [clave]: checked })}
            />
          ))}
        </div>
      </div>
    </fieldset>
  );
}
