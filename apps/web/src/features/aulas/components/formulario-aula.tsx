import {
  ApiErrorCode,
  type Classroom,
  type CreateClassroomInput,
  EnglishLevel,
  MeetingProvider,
  type ValidationErrorDetail,
} from '@academia/types';
import { CalendarClock, LoaderCircle, Lock } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useAnnounce } from '@/hooks/use-announce';
import { ApiClientError } from '@/lib/api-error';
import { useCreateClassroom } from '../hooks/use-create-classroom';
import { aInstanteISO, describirDuracion, describirHorario } from '../lib/horario';
import { duracionesDisponibles, nivelesDeIngles } from '../lib/niveles';
import { etiquetaPlataformaReunion, PLATAFORMAS_OFRECIDAS } from '../lib/plataforma-reunion';
import {
  type ClassroomFieldErrors,
  type ClassroomFormValues,
  validateClassroom,
} from '../lib/validate-classroom';
import { SeccionAccesibilidadAula } from './seccion-accesibilidad-aula';

/** Orden visual de los campos: guía el foco al primer error. */
const ORDEN_DE_CAMPOS: (keyof ClassroomFormValues)[] = [
  'title',
  'description',
  'level',
  'fecha',
  'hora',
  'durationMinutes',
  'maxStudents',
  'meetingLink',
  'communicationModes',
];

const VALORES_INICIALES: ClassroomFormValues = {
  title: '',
  description: '',
  level: EnglishLevel.BEGINNER,
  maxStudents: '8',
  fecha: '',
  hora: '',
  durationMinutes: '60',
  meetingLink: '',
  communicationModes: [],
  hasInterpreter: false,
  hasLiveCaptions: false,
  hasVisualMaterials: false,
  meetingProvider: MeetingProvider.GOOGLE_MEET,
};

/**
 * Traducción de los campos del contrato a los del formulario.
 *
 * El backend valida `scheduledAt`, que en pantalla son DOS campos. Sin esta
 * tabla, su error se perdería —no hay ningún input con ese id— y el profesor
 * vería un formulario sin ninguna marca roja y sin saber qué arreglar.
 */
const CAMPO_DEL_BACKEND: Record<string, keyof ClassroomFormValues> = {
  title: 'title',
  description: 'description',
  level: 'level',
  maxStudents: 'maxStudents',
  scheduledAt: 'fecha',
  durationMinutes: 'durationMinutes',
  meetingLink: 'meetingLink',
  communicationModes: 'communicationModes',
  meetingProvider: 'meetingProvider',
};

export function FormularioAula({ onCreada }: { onCreada: (classroom: Classroom) => void }) {
  const [values, setValues] = useState<ClassroomFormValues>(VALORES_INICIALES);
  const [errors, setErrors] = useState<ClassroomFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useCreateClassroom();
  const announce = useAnnounce();

  // B5: la confirmación en texto completo con la zona nombrada. Se recalcula al
  // teclear, así que el profesor ve el instante que está eligiendo ANTES de
  // enviar, no después de haber publicado la clase a las 6 de la mañana.
  const instanteElegido =
    values.fecha && values.hora ? aInstanteISO({ fecha: values.fecha, hora: values.hora }) : null;

  function updateField<K extends keyof ClassroomFormValues>(
    field: K,
    value: ClassroomFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError(null);
  }

  function focusFirstError(current: ClassroomFieldErrors) {
    const first = ORDEN_DE_CAMPOS.find((field) => current[field]);
    if (!first) return;
    document.getElementById(first)?.focus();
  }

  function applyFieldErrors(next: ClassroomFieldErrors) {
    setErrors(next);
    focusFirstError(next);

    const count = Object.keys(next).length;
    announce(
      count === 1
        ? 'El formulario tiene un error. Revisa el campo marcado.'
        : `El formulario tiene ${count} errores. Revisa los campos marcados.`,
    );
  }

  function handleServerError(error: unknown) {
    if (error instanceof ApiClientError) {
      if (error.code === ApiErrorCode.VALIDATION_ERROR) {
        const fields = (error.details?.fields as ValidationErrorDetail[] | undefined) ?? [];
        const mapped: ClassroomFieldErrors = {};
        for (const field of fields) {
          const campo = CAMPO_DEL_BACKEND[field.field];
          if (campo) mapped[campo] = field.message;
        }
        if (Object.keys(mapped).length > 0) {
          applyFieldErrors(mapped);
          return;
        }
      }

      // Cuenta pendiente, rechazada o suspendida, y falta de permiso: el
      // servidor ya manda un texto cierto para cada caso, y es más específico
      // que cualquiera que pudiéramos escribir sin saber cuál de los tres es.
      setFormError(error.message || 'No pudimos publicar la clase. Inténtalo otra vez.');
      announce('No pudimos publicar la clase.');
      return;
    }

    setFormError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.');
    announce('No pudimos conectar con el servidor.');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const clientErrors = validateClassroom(values);
    if (Object.keys(clientErrors).length > 0) {
      applyFieldErrors(clientErrors);
      return;
    }
    setErrors({});

    const scheduledAt = aInstanteISO({ fecha: values.fecha, hora: values.hora });
    if (!scheduledAt) {
      applyFieldErrors({ fecha: 'Esa fecha no existe. Revisa el día y el mes.' });
      return;
    }

    const input: CreateClassroomInput = {
      title: values.title.trim(),
      description: values.description.trim(),
      level: values.level,
      maxStudents: Number(values.maxStudents),
      scheduledAt,
      durationMinutes: Number(values.durationMinutes),
      meetingLink: values.meetingLink.trim(),
      communicationModes: values.communicationModes,
      hasInterpreter: values.hasInterpreter,
      hasLiveCaptions: values.hasLiveCaptions,
      hasVisualMaterials: values.hasVisualMaterials,
      meetingProvider: values.meetingProvider,
    };

    mutation.mutate(input, {
      onSuccess: (data) => onCreada(data.classroom),
      onError: handleServerError,
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {formError && (
        <Callout variant="destructive" live="assertive" title="No pudimos publicar la clase">
          <p>{formError}</p>
        </Callout>
      )}

      <Field id="title" label="Nombre de la clase" required error={errors.title}>
        <Input
          name="title"
          maxLength={120}
          value={values.title}
          onChange={(event) => updateField('title', event.target.value)}
        />
      </Field>

      <Field
        id="description"
        label="Descripción"
        required
        error={errors.description}
        description="Cuenta qué se practica en la clase. Es lo que lee el estudiante para decidir si es para él."
      >
        <textarea
          name="description"
          rows={4}
          maxLength={2000}
          value={values.description}
          onChange={(event) => updateField('description', event.target.value)}
          className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base text-foreground transition-colors aria-invalid:border-destructive-border"
        />
      </Field>

      <Field id="level" label="Nivel" required error={errors.level}>
        <NativeSelect
          name="level"
          value={values.level}
          onChange={(event) => updateField('level', event.target.value as EnglishLevel)}
        >
          {Object.entries(nivelesDeIngles).map(([value, { nombre, ayuda }]) => (
            <option key={value} value={value}>
              {nombre} — {ayuda}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {/*
        Fecha, hora y duración van juntas y con controles NATIVOS. Un date-picker
        propio es la forma más rápida de dejar fuera a quien navega con teclado,
        y aquí no compensa: `<input type="date">` se rellena tecleando y ya viene
        traducido y anunciado por el lector de pantalla.
      */}
      <fieldset className="space-y-4 rounded-xl border border-border bg-muted/40 p-5">
        <legend className="px-1 text-base font-medium text-foreground">Cuándo es la clase</legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="fecha" label="Día" required error={errors.fecha}>
            <Input
              type="date"
              name="fecha"
              value={values.fecha}
              onChange={(event) => updateField('fecha', event.target.value)}
            />
          </Field>

          <Field id="hora" label="Hora de inicio" required error={errors.hora}>
            <Input
              type="time"
              name="hora"
              value={values.hora}
              onChange={(event) => updateField('hora', event.target.value)}
            />
          </Field>

          <Field id="durationMinutes" label="Duración" required error={errors.durationMinutes}>
            <NativeSelect
              name="durationMinutes"
              value={values.durationMinutes}
              onChange={(event) => updateField('durationMinutes', event.target.value)}
            >
              {duracionesDisponibles.map((minutos) => (
                <option key={minutos} value={minutos}>
                  {describirDuracion(minutos)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>

        {/*
          B5. `aria-live="polite"` y no un simple párrafo: quien no ve la
          pantalla necesita enterarse de que el instante cambió al tocar la
          hora, y esto es lo único que confirma la zona horaria.
        */}
        <Callout variant="info" icon={CalendarClock} live="polite">
          {instanteElegido ? (
            <p>
              La clase empieza el <strong>{describirHorario(instanteElegido)}</strong> y dura{' '}
              {describirDuracion(Number(values.durationMinutes))}.
            </p>
          ) : (
            <p>Elige el día y la hora para ver cuándo empieza la clase en tu zona horaria.</p>
          )}
        </Callout>
      </fieldset>

      <Field
        id="maxStudents"
        label="Cupo máximo"
        required
        error={errors.maxStudents}
        description="Cuántos estudiantes pueden reservar. Cuando se llene, la clase deja de aceptar reservas."
      >
        <Input
          type="number"
          inputMode="numeric"
          name="maxStudents"
          min={1}
          value={values.maxStudents}
          onChange={(event) => updateField('maxStudents', event.target.value)}
        />
      </Field>

      {/*
        B3. La ayuda es PERMANENTE, no un tooltip ni un texto que desaparece al
        escribir: contiene la promesa central del producto —el enlace no se
        reparte, se abre 30 minutos antes— y el profesor tiene que entenderla
        justo en el momento en que lo pega, no después.
      */}
      <Field
        id="meetingLink"
        label="Enlace de la reunión"
        required
        error={errors.meetingLink}
        description={
          <>
            Pega aquí el enlace de la reunión que creaste en Zoom o Meet.
            <span className="mt-2 flex items-start gap-1.5 font-medium text-foreground">
              <Lock aria-hidden="true" strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
              <span>
                Tus estudiantes solo verán este enlace 30 minutos antes de la clase, y solo si
                reservaron su cupo. Se guarda cifrado.
              </span>
            </span>
          </>
        }
      >
        <Input
          type="url"
          name="meetingLink"
          inputMode="url"
          placeholder="https://meet.google.com/abc-defg-hij"
          value={values.meetingLink}
          onChange={(event) => updateField('meetingLink', event.target.value)}
        />
      </Field>

      {/*
        T9: junto al campo del enlace, no dentro de la sección de
        accesibilidad — es sobre ESTE enlace, no un dato del aula en general.
      */}
      <Field
        id="meetingProvider"
        label="Plataforma de la reunión"
        required
        error={errors.meetingProvider}
        description="Los subtítulos automáticos no funcionan igual en todas las plataformas: el estudiante lo necesita saber para prepararse."
      >
        <NativeSelect
          name="meetingProvider"
          value={values.meetingProvider}
          onChange={(event) =>
            updateField(
              'meetingProvider',
              event.target.value as ClassroomFormValues['meetingProvider'],
            )
          }
        >
          {PLATAFORMAS_OFRECIDAS.map((plataforma) => (
            <option key={plataforma} value={plataforma}>
              {etiquetaPlataformaReunion[plataforma]}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <SeccionAccesibilidadAula
        values={values}
        onChange={(patch) => {
          for (const [field, value] of Object.entries(patch)) {
            updateField(field as keyof ClassroomFormValues, value as never);
          }
        }}
        error={errors.communicationModes}
      />

      <Button type="submit" disabled={mutation.isPending} className="h-12 w-full gap-2 text-base">
        {mutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
            Publicando la clase…
          </>
        ) : (
          'Publicar la clase'
        )}
      </Button>
    </form>
  );
}
