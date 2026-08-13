import {
  ApiErrorCode,
  type RegisterInput,
  type User,
  UserRole,
  type ValidationErrorDetail,
} from '@academia/types';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { RadioCardGroup } from '@/components/ui/radio-card-group';
import { useAnnounce } from '@/hooks/use-announce';
import { ApiClientError } from '@/lib/api-error';
import {
  communicationPreferenceLabels,
  hearingLossLevelLabels,
  roleOptions,
} from '../lib/accessibility-labels';
import { useRegister } from '../hooks/use-register';
import {
  type FieldErrors,
  type RegisterFormValues,
  validateRegister,
} from '../lib/validate-register';

/** Orden visual de los campos: guía el foco al primer error (§7.3). */
const FIELD_ORDER: (keyof RegisterFormValues)[] = [
  'email',
  'password',
  'firstName',
  'lastName',
  'role',
  'hearingLossLevel',
  'communicationPreference',
];

const INITIAL_VALUES: RegisterFormValues = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: UserRole.STUDENT,
  hearingLossLevel: '',
  communicationPreference: '',
};

function isFormField(name: string): name is keyof RegisterFormValues {
  return (FIELD_ORDER as string[]).includes(name);
}

export function RegisterForm({ onRegistered }: { onRegistered: (user: User) => void }) {
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useRegister();
  const announce = useAnnounce();

  const isStudent = values.role === UserRole.STUDENT;

  function updateField<K extends keyof RegisterFormValues>(field: K, value: RegisterFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError(null);
  }

  function focusFirstError(current: FieldErrors) {
    const first = FIELD_ORDER.find((field) => current[field]);
    if (!first) return;
    const target =
      first === 'role'
        ? document.querySelector<HTMLInputElement>('input[name="role"]')
        : document.getElementById(first);
    target?.focus();
  }

  function announceErrorCount(count: number) {
    announce(
      count === 1
        ? 'El formulario tiene un error. Revisa el campo marcado.'
        : `El formulario tiene ${count} errores. Revisa los campos marcados.`,
    );
  }

  function applyFieldErrors(next: FieldErrors) {
    setErrors(next);
    focusFirstError(next);
    announceErrorCount(Object.keys(next).length);
  }

  function handleServerError(error: unknown) {
    if (error instanceof ApiClientError) {
      if (error.code === ApiErrorCode.VALIDATION_ERROR) {
        const fields = (error.details?.fields as ValidationErrorDetail[] | undefined) ?? [];
        const mapped: FieldErrors = {};
        for (const field of fields) {
          if (isFormField(field.field)) mapped[field.field] = field.message;
        }
        if (Object.keys(mapped).length > 0) {
          applyFieldErrors(mapped);
          return;
        }
      }

      if (error.code === ApiErrorCode.EMAIL_ALREADY_EXISTS) {
        applyFieldErrors({
          email: 'Ya existe una cuenta con este email. Usa otro o inicia sesión.',
        });
        return;
      }

      setFormError(error.message || 'No pudimos crear tu cuenta. Inténtalo otra vez.');
      announce('Ocurrió un error al crear la cuenta.');
      return;
    }

    setFormError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.');
    announce('No pudimos conectar con el servidor.');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const clientErrors = validateRegister(values);
    if (Object.keys(clientErrors).length > 0) {
      applyFieldErrors(clientErrors);
      return;
    }
    setErrors({});

    const input: RegisterInput = {
      email: values.email.trim(),
      password: values.password,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      role: values.role,
    };
    // Los campos de accesibilidad solo aplican al estudiante y solo si los indicó.
    if (isStudent) {
      if (values.hearingLossLevel) input.hearingLossLevel = values.hearingLossLevel;
      if (values.communicationPreference)
        input.communicationPreference = values.communicationPreference;
    }

    mutation.mutate(input, {
      onSuccess: (data) => onRegistered(data.user),
      onError: handleServerError,
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <Callout variant="destructive" live="assertive" title="No pudimos crear tu cuenta">
          <p>{formError}</p>
        </Callout>
      )}

      <Field id="email" label="Email" required error={errors.email}>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
        />
      </Field>

      <Field
        id="password"
        label="Contraseña"
        required
        error={errors.password}
        description="Mínimo 8 caracteres, con al menos una letra y un número."
        adornment={
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" strokeWidth={2} className="size-5" />
            ) : (
              <Eye aria-hidden="true" strokeWidth={2} className="size-5" />
            )}
          </button>
        }
      >
        <Input
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="new-password"
          className="pr-11"
          value={values.password}
          onChange={(event) => updateField('password', event.target.value)}
        />
      </Field>

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

      <fieldset className="space-y-3">
        <legend id="role-label" className="text-sm font-medium text-foreground">
          Quiero registrarme como
          <span className="font-normal text-muted-foreground"> (obligatorio)</span>
        </legend>
        <RadioCardGroup
          name="role"
          labelledBy="role-label"
          options={roleOptions}
          value={values.role}
          onChange={(role) => updateField('role', role)}
        />
      </fieldset>

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
              Nos ayudan a adaptar la plataforma a ti. Son opcionales y puedes cambiarlas más tarde
              desde tu perfil.
            </p>
          </div>

          <Field id="hearingLossLevel" label="Nivel de hipoacusia" error={errors.hearingLossLevel}>
            <NativeSelect
              name="hearingLossLevel"
              value={values.hearingLossLevel}
              onChange={(event) =>
                updateField(
                  'hearingLossLevel',
                  event.target.value as RegisterFormValues['hearingLossLevel'],
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
                  event.target.value as RegisterFormValues['communicationPreference'],
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

      <Button type="submit" disabled={mutation.isPending} className="h-12 w-full gap-2 text-base">
        {mutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
            Creando tu cuenta…
          </>
        ) : (
          'Crear mi cuenta'
        )}
      </Button>
    </form>
  );
}
