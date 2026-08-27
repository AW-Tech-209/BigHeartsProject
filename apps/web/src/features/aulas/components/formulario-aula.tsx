import {
  ApiErrorCode,
  CLASS_MAX_DURATION_MINUTES_DEFAULT,
  type Classroom,
  type ClassroomDetail,
  type ClassroomLeadTimeWarningDetails,
  type CreateClassroomInput,
  EnglishLevel,
  MeetingProvider,
  type ValidationErrorDetail,
} from '@academia/types';
import { CalendarClock, Copy, LoaderCircle, Lock } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useAnnounce } from '@/hooks/use-announce';
import { ApiClientError } from '@/lib/api-error';
import { useCreateClassroom } from '../hooks/use-create-classroom';
import { useUpdateClassroom } from '../hooks/use-update-classroom';
import {
  detallesDeAntelacion,
  detallesDeDuracion,
  detallesDeSolapamiento,
  mensajeDeSolapamiento,
} from '../lib/coherencia-temporal';
import { aFechaYHora, aInstanteISO, describirDuracion, describirHorario } from '../lib/horario';
import { duracionesHasta, nivelesDeIngles } from '../lib/niveles';
import { etiquetaPlataformaReunion, PLATAFORMAS_OFRECIDAS } from '../lib/plataforma-reunion';
import {
  type ClassroomFieldErrors,
  type ClassroomFormValues,
  validateClassroom,
} from '../lib/validate-classroom';
import { DialogoPocaAntelacion } from './dialogo-poca-antelacion';
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

/** Los valores con los que arranca el formulario: en blanco al crear, precargados al editar. */
function valoresIniciales(aula?: ClassroomDetail): ClassroomFormValues {
  if (!aula) {
    return {
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
  }

  const { fecha, hora } = aFechaYHora(aula.scheduledAt);
  return {
    title: aula.title,
    description: aula.description,
    level: aula.level,
    maxStudents: String(aula.maxStudents),
    fecha,
    hora,
    durationMinutes: String(aula.durationMinutes),
    meetingLink: aula.meetingLink ?? '',
    communicationModes: aula.communicationModes,
    hasInterpreter: aula.hasInterpreter,
    hasLiveCaptions: aula.hasLiveCaptions,
    hasVisualMaterials: aula.hasVisualMaterials,
    meetingProvider: aula.meetingProvider,
  };
}

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

type FormularioAulaProps = {
  /** Presente en modo edición (HU-202): precarga el formulario y usa `PATCH` en vez de `POST`. */
  aula?: ClassroomDetail;
  /**
   * Presente al duplicar (HU-213): precarga el formulario con el aula de
   * origen, salvo fecha y hora, y usa `POST` como una creación cualquiera —
   * a diferencia de `aula`, nunca activa el modo edición.
   */
  duplicarDesde?: ClassroomDetail;
  onGuardada: (classroom: Classroom) => void;
};

export function FormularioAula({ aula, duplicarDesde, onGuardada }: FormularioAulaProps) {
  const [values, setValues] = useState<ClassroomFormValues>(() => {
    if (duplicarDesde) return { ...valoresIniciales(duplicarDesde), fecha: '', hora: '' };
    return valoresIniciales(aula);
  });
  const [errors, setErrors] = useState<ClassroomFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * HU-212, AC7: el último aviso de poca antelación que respondió el servidor, y
   * si sigue esperando una decisión.
   *
   * Son dos estados y no uno **porque el diálogo se pinta también mientras se
   * cierra**: si el aviso se vaciara al decidir, la transición de salida
   * ocurriría sobre un diálogo sin texto. El contenido se queda; lo que cambia
   * es si está abierto.
   */
  const [aviso, setAviso] = useState<ClassroomLeadTimeWarningDetails | null>(null);
  const [avisoAbierto, setAvisoAbierto] = useState(false);

  /**
   * HU-212, T9: el tope de duración que aplica el servidor.
   *
   * Arranca con el valor de fábrica del contrato porque es lo único que se sabe
   * antes de hablar con la API, **pero el servidor manda**: si una respuesta
   * `CLASSROOM_DURATION_INVALID` revela otro más bajo, la lista de opciones se
   * recorta a ese y ya no se puede volver a elegir la duración rechazada.
   */
  const [maximoDuracion, setMaximoDuracion] = useState(CLASS_MAX_DURATION_MINUTES_DEFAULT);

  /** El campo al que vuelve el foco cuando el profesor decide cambiar la hora. */
  const horaRef = useRef<HTMLInputElement>(null);

  // AC3: al duplicar, fecha es el único campo vacío. Corre después del foco
  // que `<PaginaCabecera>` pone en el `<h1>` al montar, así que gana el último.
  useEffect(() => {
    if (duplicarDesde) document.getElementById('fecha')?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr una vez, al montar; `duplicarDesde` no cambia en la vida del componente.
  }, []);

  /**
   * Dos mutaciones montadas siempre, para no romper las reglas de los hooks —
   * `crear`/`editar` cambiarían de rama según `aula` en cada render. Solo se
   * llama a `.mutate()` de la que corresponde; la otra no dispara nada.
   */
  const crear = useCreateClassroom();
  const editar = useUpdateClassroom(aula?.id ?? '');
  const mutation = aula ? editar : crear;
  const announce = useAnnounce();
  /** El verbo que nombran los mensajes de error, según el modo. */
  const verboFallido = aula ? 'guardar los cambios' : 'publicar la clase';

  /**
   * HU-306, D30: con reservas `CONFIRMED` vivas, el horario se bloquea —
   * reprogramar puede chocar con la agenda de cada estudiante ya reservado.
   * El servidor es quien manda (§4.8); esto solo evita un `PATCH` que ya sabe
   * que va a rechazarse.
   */
  const horarioBloqueado = Boolean(aula && aula.currentBookings > 0);

  const duracionesOfrecidas = duracionesHasta(maximoDuracion);

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
      // HU-212 — las tres reglas de coherencia temporal. Se ramifica por el
      // `code` y nunca por el `message` (`contrato-api.md` §3); el texto que se
      // pinta sale del `details`, que es donde viajan los umbrales reales.
      if (error.code === ApiErrorCode.TEACHER_SCHEDULE_CONFLICT) {
        const detalles = detallesDeSolapamiento(error.details);

        // Bajo «Día», igual que el `scheduledAt` del backend: el choque es del
        // instante, y el instante en pantalla empieza en ese campo. Repetir el
        // mismo párrafo bajo «Día» y bajo «Hora de inicio» solo haría más
        // largo un mensaje que ya es largo por nombrar el aula que estorba.
        applyFieldErrors({
          fecha: detalles ? mensajeDeSolapamiento(detalles) : error.message,
        });
        return;
      }

      if (error.code === ApiErrorCode.CLASSROOM_DURATION_INVALID) {
        const detalles = detallesDeDuracion(error.details);

        if (detalles) {
          setMaximoDuracion(detalles.maximoMinutos);
          // El valor elegido ya no está entre las opciones: sin esto el
          // `<select>` se quedaría en blanco y el profesor no sabría qué envía.
          const permitidas = duracionesHasta(detalles.maximoMinutos);
          setValues((prev) =>
            permitidas.includes(Number(prev.durationMinutes))
              ? prev
              : { ...prev, durationMinutes: String(permitidas[permitidas.length - 1]) },
          );
        }

        applyFieldErrors({ durationMinutes: error.message });
        return;
      }

      if (error.code === ApiErrorCode.CLASSROOM_LEAD_TIME_WARNING) {
        const detalles = detallesDeAntelacion(error.details);

        if (detalles) {
          // No es un error del formulario: es una pregunta. Abre el diálogo, y
          // el diálogo se lleva el foco por su cuenta — anunciarlo además
          // pisaría su propio título.
          setAviso(detalles);
          setAvisoAbierto(true);
          return;
        }
        // Sin los dos números no se puede explicar la consecuencia, y un
        // diálogo que dice «confirma» sin decir qué pasa no es una decisión.
        // Cae al aviso de bloque con el mensaje del servidor.
      }

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
      setFormError(error.message || `No pudimos ${verboFallido}. Inténtalo otra vez.`);
      announce(`No pudimos ${verboFallido}.`);
      return;
    }

    setFormError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.');
    announce('No pudimos conectar con el servidor.');
  }

  /**
   * Envía el aula. `confirmarPocaAntelacion` solo se pone cuando el profesor ya
   * decidió en el diálogo (AC7); el flag no salta ni el solapamiento ni la
   * duración, que el servidor rechaza igual.
   */
  function publicar(confirmarPocaAntelacion: boolean) {
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
      ...(confirmarPocaAntelacion ? { confirmarPocaAntelacion: true } : {}),
    };

    mutation.mutate(input, {
      // El diálogo se cierra pase lo que pase, y por eso el `setAvisoAbierto(false)`
      // va en las dos ramas: mientras esté abierto tapa la página, así que un
      // aviso de error puesto detrás no lo vería nadie. Si la respuesta trae
      // otro aviso, `handleServerError` lo vuelve a abrir en el mismo lote de
      // renderizado.
      onSuccess: (data) => {
        setAvisoAbierto(false);
        onGuardada(data.classroom);
      },
      onError: (error) => {
        setAvisoAbierto(false);
        handleServerError(error);
      },
    });
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

    publicar(false);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {formError && (
        <Callout
          variant="destructive"
          live="assertive"
          title={aula ? 'No pudimos guardar los cambios' : 'No pudimos publicar la clase'}
        >
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

        {/* HU-306, T6: nunca un campo deshabilitado sin motivo — la razón y la
            salida van justo encima de los tres campos que bloquea. */}
        {horarioBloqueado && (
          <Callout variant="attention" icon={Lock} title="La fecha y la duración están bloqueadas">
            <div className="space-y-3">
              <p>
                Esta clase ya tiene estudiantes con un cupo reservado: cambiar la fecha o la
                duración podría chocar con otra clase que ya tienen agendada. Si necesitas otro
                horario, cancela esta clase y crea otra.
              </p>
              <Button
                type="button"
                variant="outline"
                render={<Link to={`/mis-aulas/nueva?desde=${aula?.id}`} />}
                className="h-11 gap-2 px-5 text-base"
              >
                <Copy aria-hidden="true" strokeWidth={2} className="size-4" />
                Duplicar clase
              </Button>
            </div>
          </Callout>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="fecha" label="Día" required error={errors.fecha}>
            <Input
              type="date"
              name="fecha"
              disabled={horarioBloqueado}
              value={values.fecha}
              onChange={(event) => updateField('fecha', event.target.value)}
            />
          </Field>

          <Field id="hora" label="Hora de inicio" required error={errors.hora}>
            <Input
              type="time"
              name="hora"
              ref={horaRef}
              disabled={horarioBloqueado}
              value={values.hora}
              onChange={(event) => updateField('hora', event.target.value)}
            />
          </Field>

          <Field id="durationMinutes" label="Duración" required error={errors.durationMinutes}>
            <NativeSelect
              name="durationMinutes"
              disabled={horarioBloqueado}
              value={values.durationMinutes}
              onChange={(event) => updateField('durationMinutes', event.target.value)}
            >
              {/* AC6/T9: la lista está acotada por el tope del servidor, así
                  que la duración inválida no se puede llegar a elegir. Si el
                  entorno baja el tope, la lista se recorta en la primera
                  respuesta y ya no vuelve a ofrecerla. */}
              {duracionesOfrecidas.map((minutos) => (
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
            {aula ? 'Guardando los cambios…' : 'Publicando la clase…'}
          </>
        ) : aula ? (
          'Guardar los cambios'
        ) : (
          'Publicar la clase'
        )}
      </Button>

      {/* AC7. Va dentro del `<form>` pero se pinta en un portal, así que no
          hereda su maquetación; está aquí para quedar al lado del envío que lo
          provoca. Nadie lo abre: lo abre la respuesta del servidor. */}
      <DialogoPocaAntelacion
        aviso={aviso}
        abierto={avisoAbierto}
        titulo={values.title.trim()}
        publicando={mutation.isPending}
        onPublicar={() => publicar(true)}
        onCambiarHora={() => setAvisoAbierto(false)}
        volverAlHorario={horaRef}
      />
    </form>
  );
}
