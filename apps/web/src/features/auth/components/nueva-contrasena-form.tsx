import { ApiErrorCode, type ValidationErrorDetail } from '@academia/types';
import { Eye, EyeOff, KeyRound, Lock, LoaderCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAnnounce } from '@/hooks/use-announce';
import { ApiClientError } from '@/lib/api-error';
import { useResetPassword } from '../hooks/use-reset-password';
import { validatePassword } from '../lib/validate-password';

type EnlaceRoto = 'invalido' | 'caducado';

export function NuevaContrasenaForm({ token, onHecho }: { token: string; onHecho: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [enlace, setEnlace] = useState<EnlaceRoto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useResetPassword();
  const announce = useAnnounce();

  function limpiar() {
    setError(undefined);
    setEnlace(null);
    setFormError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    limpiar();

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      document.getElementById('password')?.focus();
      announce('El formulario tiene un error. Revisa el campo marcado.');
      return;
    }

    mutation.mutate(
      { token, password },
      {
        onSuccess: () => {
          announce('Contraseña cambiada. Ya puedes iniciar sesión.');
          onHecho();
        },
        onError: (err) => {
          const apiError = err instanceof ApiClientError ? err : null;
          const code = apiError?.code ?? null;

          if (code === ApiErrorCode.VALIDATION_ERROR) {
            const fields = (apiError?.details?.fields as ValidationErrorDetail[] | undefined) ?? [];
            const mensaje =
              fields.find((field) => field.field === 'password')?.message ??
              'La contraseña no cumple los requisitos.';
            setError(mensaje);
            document.getElementById('password')?.focus();
            announce('El formulario tiene un error. Revisa el campo marcado.');
            return;
          }

          if (code === ApiErrorCode.PASSWORD_RESET_TOKEN_EXPIRED) {
            setEnlace('caducado');
            announce('El enlace caducó. Pide uno nuevo.');
            return;
          }

          if (code === ApiErrorCode.PASSWORD_RESET_TOKEN_INVALID) {
            setEnlace('invalido');
            announce('El enlace ya no sirve. Pide uno nuevo.');
            return;
          }

          setFormError(
            'No pudimos cambiar la contraseña. Revisa tu conexión e inténtalo otra vez.',
          );
          announce('No pudimos cambiar la contraseña.');
        },
      },
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {enlace && (
        <Callout
          variant="destructive"
          live="assertive"
          title={enlace === 'caducado' ? 'El enlace caducó' : 'El enlace ya no sirve'}
        >
          <p>
            {enlace === 'caducado'
              ? 'El enlace del correo caduca a los pocos minutos. '
              : 'Este enlace ya se usó o no es válido. '}
            <Link
              to="/recuperar-contrasena"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Pide uno nuevo
            </Link>
            .
          </p>
        </Callout>
      )}

      {formError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cambiar la contraseña">
          <p>{formError}</p>
        </Callout>
      )}

      <Field
        id="password"
        label="Contraseña nueva"
        required
        error={error}
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
          iconoInicio={Lock}
          className="pr-11"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            limpiar();
          }}
        />
      </Field>

      <Button type="submit" disabled={mutation.isPending} className="h-12 w-full gap-2 text-base">
        {mutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
            Guardando la contraseña…
          </>
        ) : (
          <>
            <KeyRound aria-hidden="true" strokeWidth={2} className="size-5" />
            Guardar contraseña nueva
          </>
        )}
      </Button>
    </form>
  );
}
