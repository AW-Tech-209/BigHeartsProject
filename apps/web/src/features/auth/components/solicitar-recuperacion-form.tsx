import { ApiErrorCode } from '@academia/types';
import { LoaderCircle, Mail, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAnnounce } from '@/hooks/use-announce';
import { ApiClientError } from '@/lib/api-error';
import { useForgotPassword } from '../hooks/use-forgot-password';
import { validateSolicitudRecuperacion } from '../lib/validate-solicitud-recuperacion';

export function SolicitarRecuperacionForm({ onEnviado }: { onEnviado: () => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useForgotPassword();
  const announce = useAnnounce();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationError = validateSolicitudRecuperacion(email);
    if (validationError) {
      setError(validationError);
      document.getElementById('email')?.focus();
      announce('El formulario tiene un error. Revisa el campo marcado.');
      return;
    }
    setError(undefined);

    mutation.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          announce('Listo. Si hay una cuenta con ese email, te enviamos un enlace.');
          onEnviado();
        },
        onError: (err) => {
          const code = err instanceof ApiClientError ? err.code : null;
          const mensaje =
            code === ApiErrorCode.TOO_MANY_REQUESTS
              ? 'Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.'
              : 'No pudimos enviar el enlace. Revisa tu conexión e inténtalo otra vez.';
          setFormError(mensaje);
          announce(mensaje);
          document.getElementById('email')?.focus();
        },
      },
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <Callout variant="destructive" live="assertive" title="No pudimos enviar el enlace">
          <p>{formError}</p>
        </Callout>
      )}

      <Field id="email" label="Email" required error={error}>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          iconoInicio={Mail}
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(undefined);
            setFormError(null);
          }}
        />
      </Field>

      <Button type="submit" disabled={mutation.isPending} className="h-12 w-full gap-2 text-base">
        {mutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
            Enviando el enlace…
          </>
        ) : (
          <>
            <Send aria-hidden="true" strokeWidth={2} className="size-5" />
            Enviar enlace
          </>
        )}
      </Button>
    </form>
  );
}
