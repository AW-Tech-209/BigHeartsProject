import {
  ApiErrorCode,
  type ClassroomSupport,
  type HearingLossLevel,
  type InstructionMode,
  UserRole,
} from '@academia/types';
import { Check, LoaderCircle, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { LayoutAutenticacion } from '@/components/layout/layout-autenticacion';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { CamposPreferencia } from '@/features/auth/components/campos-preferencia';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCambiarContrasena } from '@/features/auth/hooks/use-cambiar-contrasena';
import { hearingLossLevelLabels } from '@/features/auth/lib/accessibility-labels';
import { requisitosContrasena } from '@/features/auth/lib/requisitos-contrasena';
import { validatePassword } from '@/features/auth/lib/validate-password';
import { useUpdateProfile } from '@/features/profile/hooks/use-update-profile';
import { useAnnounce } from '@/hooks/use-announce';
import { ApiClientError } from '@/lib/api-error';

/** `state` con el que se llega al panel para mostrar «Todo listo». */
const ESTADO_PRIMER_INGRESO = { primerIngreso: true };

type Campo = 'actual' | 'nueva' | 'confirmacion';

/**
 * `/primer-ingreso`: paso 1 crear la contraseña (obligatorio); paso 2, solo
 * estudiantes, contar cómo prefieren seguir las clases (se puede dejar para después).
 */
export function PrimerIngresoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paso, setPaso] = useState<1 | 2>(1);
  // Foto del montaje: al cambiar la contraseña la bandera cae y no debe expulsar del paso 2.
  const [necesitaCambio] = useState(user?.debeCambiarContrasena ?? false);

  if (!user) return null;
  if (paso === 1 && !necesitaCambio) return <Navigate to="/panel" replace />;

  const irAlPanel = () => navigate('/panel', { replace: true, state: ESTADO_PRIMER_INGRESO });
  const esEstudiante = user.role === UserRole.STUDENT;

  return (
    <LayoutAutenticacion>
      <div className="mx-auto w-full max-w-lg space-y-6">
        {paso === 1 ? (
          <>
            <PaginaCabecera
              titulo="Crea tu contraseña"
              contexto="La contraseña temporal solo sirve para este primer ingreso. Elige una que solo tú conozcas."
            />
            <PasoContrasena onHecho={() => (esEstudiante ? setPaso(2) : irAlPanel())} />
          </>
        ) : (
          <>
            <PaginaCabecera
              titulo="¿Cómo prefieres seguir las clases?"
              tituloDocumento="Tus preferencias"
              contexto="Con esto destacamos las clases que te sirven. Puedes cambiarlo después en tu perfil."
            />
            <PasoPreferencia onHecho={irAlPanel} />
          </>
        )}
      </div>
    </LayoutAutenticacion>
  );
}

function PasoContrasena({ onHecho }: { onHecho: () => void }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useCambiarContrasena();
  const announce = useAnnounce();
  const requisitos = requisitosContrasena(nueva);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const next: Partial<Record<Campo, string>> = {};
    if (!actual) next.actual = 'Escribe la contraseña temporal que te dio la academia.';
    const errorNueva = validatePassword(nueva);
    if (errorNueva) next.nueva = errorNueva;
    else if (nueva === actual) next.nueva = 'La contraseña nueva debe ser distinta de la temporal.';
    if (nueva !== confirmacion) next.confirmacion = 'Las dos contraseñas no coinciden.';
    setErrores(next);

    const primero = (['actual', 'nueva', 'confirmacion'] as const).find((campo) => next[campo]);
    if (primero) {
      document.getElementById(primero)?.focus();
      announce('El formulario tiene un error. Revisa el campo marcado.');
      return;
    }

    mutation.mutate(
      { actual, nueva },
      {
        onSuccess: () => {
          announce('Contraseña creada.');
          onHecho();
        },
        onError: (err) => {
          const code = err instanceof ApiClientError ? err.code : null;
          if (code === ApiErrorCode.INVALID_CREDENTIALS) {
            setErrores({ actual: 'Esa no es tu contraseña temporal.' });
            document.getElementById('actual')?.focus();
          } else if (code === ApiErrorCode.PASSWORD_UNCHANGED) {
            setErrores({ nueva: 'La contraseña nueva debe ser distinta de la temporal.' });
            document.getElementById('nueva')?.focus();
          } else {
            setFormError(
              'No pudimos guardar tu contraseña. Revisa tu conexión e inténtalo otra vez.',
            );
          }
          announce('No pudimos guardar tu contraseña.');
        },
      },
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <Callout variant="destructive" live="assertive" title="No pudimos guardar tu contraseña">
          <p>{formError}</p>
        </Callout>
      )}

      <Field id="actual" label="Contraseña temporal" required error={errores.actual}>
        <Input
          type="password"
          name="actual"
          autoComplete="current-password"
          value={actual}
          onChange={(event) => setActual(event.target.value)}
        />
      </Field>

      <Field id="nueva" label="Contraseña nueva" required error={errores.nueva}>
        <Input
          type="password"
          name="nueva"
          autoComplete="new-password"
          value={nueva}
          onChange={(event) => setNueva(event.target.value)}
        />
      </Field>

      <ul aria-label="Requisitos de la contraseña" className="space-y-1 text-base">
        {requisitos.map(({ texto, cumple }) => (
          <li key={texto} className="flex items-center gap-2">
            {cumple ? (
              <Check aria-hidden="true" strokeWidth={2} className="size-5 text-success" />
            ) : (
              <X aria-hidden="true" strokeWidth={2} className="size-5 text-muted-foreground" />
            )}
            <span>
              {texto}
              <span className="sr-only">{cumple ? ': cumplido' : ': falta'}</span>
            </span>
          </li>
        ))}
      </ul>

      <Field
        id="confirmacion"
        label="Repite la contraseña nueva"
        required
        error={errores.confirmacion}
      >
        <Input
          type="password"
          name="confirmacion"
          autoComplete="new-password"
          value={confirmacion}
          onChange={(event) => setConfirmacion(event.target.value)}
        />
      </Field>

      <Button type="submit" disabled={mutation.isPending} className="h-12 w-full gap-2 text-base">
        {mutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
            Guardando…
          </>
        ) : (
          'Guardar contraseña'
        )}
      </Button>
    </form>
  );
}

function PasoPreferencia({ onHecho }: { onHecho: () => void }) {
  const { user } = useAuth();
  const [modo, setModo] = useState<InstructionMode | ''>('');
  const [apoyos, setApoyos] = useState<ClassroomSupport[]>([]);
  const [nivel, setNivel] = useState<HearingLossLevel | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useUpdateProfile();
  const announce = useAnnounce();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setFormError(null);

    mutation.mutate(
      {
        firstName: user.firstName,
        lastName: user.lastName,
        hearingLossLevel: nivel || null,
        preferredInstructionMode: modo || null,
        preferredSupports: apoyos,
      },
      {
        onSuccess: onHecho,
        onError: () => {
          setFormError('No pudimos guardar tus preferencias. Inténtalo otra vez o hazlo después.');
          announce('No pudimos guardar tus preferencias.');
        },
      },
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <Callout variant="destructive" live="assertive" title="No pudimos guardar tus preferencias">
          <p>{formError}</p>
        </Callout>
      )}

      <CamposPreferencia modo={modo} apoyos={apoyos} onModo={setModo} onApoyos={setApoyos} />

      <Field id="hearingLossLevel" label="Nivel de hipoacusia">
        <NativeSelect
          name="hearingLossLevel"
          value={nivel}
          onChange={(event) => setNivel(event.target.value as HearingLossLevel | '')}
        >
          <option value="">Prefiero no indicarlo</option>
          {Object.entries(hearingLossLevelLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={mutation.isPending} className="h-12 flex-1 gap-2 text-base">
          {mutation.isPending ? (
            <>
              <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
              Guardando…
            </>
          ) : (
            'Guardar y continuar'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onHecho} className="h-12 flex-1 text-base">
          Lo haré después
        </Button>
      </div>
    </form>
  );
}
