import { ApiErrorCode, type CuentaCreadaResponse, UserRole } from '@academia/types';
import { GraduationCap, LoaderCircle, Presentation, UserPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioCardGroup } from '@/components/ui/radio-card-group';
import { useAnnounce } from '@/hooks/use-announce';
import { ApiClientError } from '@/lib/api-error';
import { useCrearUsuario } from '../hooks/use-usuarios';

type Rol = UserRole.STUDENT | UserRole.TEACHER;
type Campo = 'firstName' | 'lastName' | 'email' | 'role';
type Errores = Partial<Record<Campo, string>>;

const ORDEN: Campo[] = ['firstName', 'lastName', 'email', 'role'];
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OPCIONES_ROL = [
  {
    value: UserRole.STUDENT as Rol,
    label: 'Estudiante',
    description: 'Reserva y toma clases.',
    icon: GraduationCap,
  },
  {
    value: UserRole.TEACHER as Rol,
    label: 'Profesor',
    description: 'Crea aulas y da clases.',
    icon: Presentation,
  },
];

function validar(v: { firstName: string; lastName: string; email: string; role: Rol | null }) {
  const errores: Errores = {};
  if (!v.firstName.trim()) errores.firstName = 'Escribe el nombre.';
  if (!v.lastName.trim()) errores.lastName = 'Escribe el apellido.';
  if (!v.email.trim()) errores.email = 'Escribe el correo.';
  else if (!CORREO.test(v.email.trim())) errores.email = 'Revisa el correo: no parece válido.';
  if (!v.role) errores.role = 'Elige si es estudiante o profesor.';
  return errores;
}

type Props = {
  onCreada: (cuenta: CuentaCreadaResponse) => void;
};

export function CrearCuentaForm({ onCreada }: Props) {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '' });
  const [role, setRole] = useState<Rol | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const mutation = useCrearUsuario();
  const announce = useAnnounce();

  function poner(campo: keyof typeof values, valor: string) {
    setValues((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
    setErrorGeneral(null);
  }

  function mostrarErrores(siguientes: Errores) {
    setErrores(siguientes);
    const primero = ORDEN.find((campo) => siguientes[campo]);
    if (primero === 'role') document.querySelector<HTMLInputElement>('input[name="role"]')?.focus();
    else if (primero) document.getElementById(`usuario-${primero}`)?.focus();
    announce('El formulario tiene errores. Revisa los campos marcados.');
  }

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorGeneral(null);

    const erroresCliente = validar({ ...values, role });
    if (Object.keys(erroresCliente).length > 0 || !role) {
      mostrarErrores(erroresCliente);
      return;
    }

    mutation.mutate(
      {
        variables: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          role,
        },
        onCuenta: onCreada,
      },
      {
        onError: (error) => {
          if (error instanceof ApiClientError && error.code === ApiErrorCode.EMAIL_ALREADY_EXISTS) {
            mostrarErrores({ email: 'Ya hay una cuenta con ese correo.' });
            return;
          }
          setErrorGeneral(
            error instanceof ApiClientError && error.message
              ? error.message
              : 'No pudimos crear la cuenta. Revisa tu conexión e inténtalo otra vez.',
          );
        },
      },
    );
  }

  return (
    <form noValidate onSubmit={enviar} className="space-y-6">
      {errorGeneral && (
        <Callout variant="destructive" live="assertive" title="No pudimos crear la cuenta">
          <p>{errorGeneral}</p>
        </Callout>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="usuario-firstName" label="Nombre" required error={errores.firstName}>
          <Input
            name="firstName"
            autoComplete="off"
            value={values.firstName}
            onChange={(e) => poner('firstName', e.target.value)}
          />
        </Field>
        <Field id="usuario-lastName" label="Apellido" required error={errores.lastName}>
          <Input
            name="lastName"
            autoComplete="off"
            value={values.lastName}
            onChange={(e) => poner('lastName', e.target.value)}
          />
        </Field>
      </div>

      <Field id="usuario-email" label="Correo" required error={errores.email}>
        <Input
          type="email"
          name="email"
          autoComplete="off"
          value={values.email}
          onChange={(e) => poner('email', e.target.value)}
        />
      </Field>

      <div className="grid gap-2">
        <p id="usuario-rol-etiqueta" className="text-base font-medium">
          Rol <span className="font-normal text-muted-foreground">(obligatorio)</span>
        </p>
        <RadioCardGroup
          name="role"
          labelledBy="usuario-rol-etiqueta"
          describedBy={errores.role ? 'usuario-rol-error' : undefined}
          options={OPCIONES_ROL}
          value={role}
          onChange={(valor) => {
            setRole(valor);
            setErrores((prev) => ({ ...prev, role: undefined }));
          }}
        />
        {errores.role && (
          <p id="usuario-rol-error" role="alert" className="text-sm font-medium text-destructive">
            {errores.role}
          </p>
        )}
      </div>

      <Button type="submit" disabled={mutation.isPending} className="h-12 gap-2 px-5 text-base">
        {mutation.isPending ? (
          <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
        ) : (
          <UserPlus aria-hidden="true" strokeWidth={2} className="size-5" />
        )}
        {mutation.isPending ? 'Creando la cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  );
}
