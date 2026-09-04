import {
  ApiErrorCode,
  UserRole,
  type UpdateProfileInput,
  type User,
  type ValidationErrorDetail,
} from '@academia/types';
import { Check, LoaderCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import {
  communicationPreferenceLabels,
  hearingLossLevelLabels,
} from '@/features/auth/lib/accessibility-labels';
import { useAnnounce } from '@/hooks/use-announce';
import { ApiClientError } from '@/lib/api-error';
import { useUpdateProfile } from '../hooks/use-update-profile';
import {
  type ProfileFieldErrors,
  type ProfileFormValues,
  validateProfile,
} from '../lib/validate-profile';

/** Orden visual de los campos: guía el foco al primer error. */
const FIELD_ORDER: (keyof ProfileFormValues)[] = [
  'firstName',
  'lastName',
  'hearingLossLevel',
  'communicationPreference',
];

function isFormField(name: string): name is keyof ProfileFormValues {
  return (FIELD_ORDER as string[]).includes(name);
}

/** Rellena el formulario con lo que hay guardado (AC2): nada de campos vacíos. */
function toFormValues(user: User): ProfileFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    hearingLossLevel: user.hearingLossLevel ?? '',
    communicationPreference: user.communicationPreference ?? '',
  };
}

export function ProfileForm({ user }: { user: User }) {
  const isStudent = user.role === UserRole.STUDENT;
  const [values, setValues] = useState<ProfileFormValues>(() => toFormValues(user));
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mutation = useUpdateProfile();
  const announce = useAnnounce();

  function updateField<K extends keyof ProfileFormValues>(field: K, value: ProfileFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError(null);
    // El aviso de "guardado" deja de ser cierto en cuanto se vuelve a escribir.
    setSaved(false);
  }

  function focusFirstError(current: ProfileFieldErrors) {
    const first = FIELD_ORDER.find((field) => current[field]);
    if (!first) return;
    document.getElementById(first)?.focus();
  }

  function applyFieldErrors(next: ProfileFieldErrors) {
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
        const mapped: ProfileFieldErrors = {};
        for (const field of fields) {
          if (isFormField(field.field)) mapped[field.field] = field.message;
        }
        if (Object.keys(mapped).length > 0) {
          applyFieldErrors(mapped);
          return;
        }
      }

      setFormError(error.message || 'No pudimos guardar tus cambios. Inténtalo otra vez.');
      announce('No pudimos guardar tus cambios.');
      return;
    }

    setFormError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.');
    announce('No pudimos conectar con el servidor.');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    const clientErrors = validateProfile(values);
    if (Object.keys(clientErrors).length > 0) {
      applyFieldErrors(clientErrors);
      return;
    }
    setErrors({});

    // `null` y no `undefined` en las preferencias: es cómo el contrato expresa
    // "retira la que tenía". Con `undefined` el backend las dejaría intactas y
    // el usuario no podría volver a "Prefiero no indicarlo". Solo se mandan
    // para un estudiante: son suyas (HU-504).
    const input: UpdateProfileInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      ...(isStudent && {
        hearingLossLevel: values.hearingLossLevel || null,
        communicationPreference: values.communicationPreference || null,
      }),
    };

    mutation.mutate(input, {
      onSuccess: (data) => {
        // Se repuebla con lo que devolvió el servidor, no con lo que se envió:
        // si el backend normalizó algo (recorte de espacios), se ve aquí.
        setValues(toFormValues(data.user));
        setSaved(true);
        announce('Guardamos los cambios de tu perfil.');
      },
      onError: handleServerError,
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <Callout variant="destructive" live="assertive" title="No pudimos guardar tus cambios">
          <p>{formError}</p>
        </Callout>
      )}

      {/* Éxito: color + ícono + texto, y anunciado también por la región viva
          raíz. El usuario no puede oír que se guardó (§8 de la guía de UI). */}
      {saved && (
        <Callout variant="success" live="polite" title="Cambios guardados">
          <p>Tu perfil está actualizado.</p>
        </Callout>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="firstName" label="Nombre" required error={errors.firstName}>
          <Input
            name="firstName"
            autoComplete="given-name"
            value={values.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
          />
        </Field>
        <Field id="lastName" label="Apellidos" required error={errors.lastName}>
          <Input
            name="lastName"
            autoComplete="family-name"
            value={values.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
          />
        </Field>
      </div>

      {isStudent && (
        <section
          className="space-y-5 rounded-xl border border-border bg-muted/40 p-5"
          aria-labelledby="a11y-heading"
        >
          <div className="space-y-1">
            <h2 id="a11y-heading" className="text-lg font-semibold text-foreground">
              Preferencias de accesibilidad
            </h2>
            <p className="max-w-[65ch] text-sm text-muted-foreground">
              Con estos datos adaptamos la plataforma a ti. Puedes cambiarlos cuando quieras.
            </p>
          </div>

          <Field id="hearingLossLevel" label="Nivel de hipoacusia" error={errors.hearingLossLevel}>
            <NativeSelect
              name="hearingLossLevel"
              value={values.hearingLossLevel}
              onChange={(event) =>
                updateField(
                  'hearingLossLevel',
                  event.target.value as ProfileFormValues['hearingLossLevel'],
                )
              }
            >
              <option value="">Prefiero no indicarlo</option>
              {Object.entries(hearingLossLevelLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field
            id="communicationPreference"
            label="Preferencia de comunicación"
            error={errors.communicationPreference}
          >
            <NativeSelect
              name="communicationPreference"
              value={values.communicationPreference}
              onChange={(event) =>
                updateField(
                  'communicationPreference',
                  event.target.value as ProfileFormValues['communicationPreference'],
                )
              }
            >
              <option value="">Prefiero no indicarlo</option>
              {Object.entries(communicationPreferenceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </section>
      )}

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="h-12 gap-2 text-base sm:w-auto"
      >
        {mutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
            Guardando tus cambios…
          </>
        ) : (
          <>
            <Check aria-hidden="true" strokeWidth={2} className="size-5" />
            Guardar cambios
          </>
        )}
      </Button>
    </form>
  );
}
