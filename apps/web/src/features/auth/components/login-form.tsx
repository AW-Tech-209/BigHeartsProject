import { ApiErrorCode, type AuthSession, type ValidationErrorDetail } from '@academia/types';
import { Eye, EyeOff, Lock, LoaderCircle, LogIn, Mail } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAnnounce } from '@/hooks/use-announce';
import { ApiClientError } from '@/lib/api-error';
import { useLogin } from '../hooks/use-login';
import { type LoginErrorNotice, toLoginErrorNotice } from '../lib/login-error-notice';
import { type LoginFieldErrors, type LoginFormValues, validateLogin } from '../lib/validate-login';

/** Orden visual de los campos: guía el foco al primer error (§7.3). */
const FIELD_ORDER: (keyof LoginFormValues)[] = ['email', 'password'];

const INITIAL_VALUES: LoginFormValues = { email: '', password: '' };

function isFormField(name: string): name is keyof LoginFormValues {
  return (FIELD_ORDER as string[]).includes(name);
}

export function LoginForm({ onLoggedIn }: { onLoggedIn: (session: AuthSession) => void }) {
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [notice, setNotice] = useState<LoginErrorNotice | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useLogin();
  const announce = useAnnounce();

  function updateField<K extends keyof LoginFormValues>(field: K, value: LoginFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setNotice(null);
  }

  function focusFirstError(current: LoginFieldErrors) {
    const first = FIELD_ORDER.find((field) => current[field]);
    if (!first) return;
    document.getElementById(first)?.focus();
  }

  function applyFieldErrors(next: LoginFieldErrors) {
    setErrors(next);
    focusFirstError(next);
    announce(
      Object.keys(next).length === 1
        ? 'El formulario tiene un error. Revisa el campo marcado.'
        : `El formulario tiene ${Object.keys(next).length} errores. Revisa los campos marcados.`,
    );
  }

  function handleServerError(error: unknown) {
    // Validación de campos: el mensaje va junto al input que lo causó, no en
    // el aviso de arriba, para que el usuario sepa qué corregir.
    if (error instanceof ApiClientError && error.code === ApiErrorCode.VALIDATION_ERROR) {
      const fields = (error.details?.fields as ValidationErrorDetail[] | undefined) ?? [];
      const mapped: LoginFieldErrors = {};
      for (const field of fields) {
        if (isFormField(field.field)) mapped[field.field] = field.message;
      }
      if (Object.keys(mapped).length > 0) {
        applyFieldErrors(mapped);
        return;
      }
    }

    const next = toLoginErrorNotice(error);
    setNotice(next);
    announce(next.announcement);
    // El aviso aparece encima del formulario: llevamos el foco al email para
    // que quien navega con teclado no tenga que volver a tabular desde cero.
    document.getElementById('email')?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const clientErrors = validateLogin(values);
    if (Object.keys(clientErrors).length > 0) {
      applyFieldErrors(clientErrors);
      return;
    }
    setErrors({});

    mutation.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onSuccess: (session) => {
          announce(`Sesión iniciada. Hola, ${session.user.firstName}.`);
          onLoggedIn(session);
        },
        onError: handleServerError,
      },
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {notice && (
        <Callout variant={notice.variant} icon={notice.icon} live="assertive" title={notice.title}>
          <p>{notice.message}</p>
        </Callout>
      )}

      <Field id="email" label="Email" required error={errors.email}>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          iconoInicio={Mail}
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
        labelAside={
          <Link
            to="/recuperar-contrasena"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        }
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
          autoComplete="current-password"
          iconoInicio={Lock}
          className="pr-11"
          value={values.password}
          onChange={(event) => updateField('password', event.target.value)}
        />
      </Field>

      <Button type="submit" disabled={mutation.isPending} className="h-12 w-full gap-2 text-base">
        {mutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
            Iniciando tu sesión…
          </>
        ) : (
          <>
            <LogIn aria-hidden="true" strokeWidth={2} className="size-5" />
            Iniciar sesión
          </>
        )}
      </Button>
    </form>
  );
}
