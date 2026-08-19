import { ArrowLeft, LoaderCircle, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { useProfile } from '@/features/profile/hooks/use-profile';

/**
 * Pantalla de perfil (HU-103): ver y editar los datos propios.
 *
 * Los cuatro estados que exige la guía de UI se reparten así: esta página cubre
 * `cargando`, `error` y `vacío` (perfil sin preferencias declaradas), y el
 * formulario cubre `éxito` con su aviso de guardado.
 */
export function PerfilPage() {
  const { data: user, isPending, isError, error, refetch, isRefetching } = useProfile();

  const withoutPreferences =
    user != null && user.hearingLossLevel === null && user.communicationPreference === null;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Se conserva pese a la barra de navegación: `Panel` solo es destino
            del rol ADMIN, así que para un estudiante o un profesor este enlace
            es la única salida hacia su panel. */}
        <div>
          <Button
            variant="ghost"
            render={<Link to="/panel" />}
            className="h-11 gap-2 px-3 text-base"
          >
            <ArrowLeft aria-hidden="true" strokeWidth={2} className="size-5" />
            Volver a tu panel
          </Button>
        </div>

        <PaginaCabecera
          titulo="Tu perfil"
          contexto="Revisa y actualiza tus datos. Tus preferencias de accesibilidad nos dicen cómo adaptar la plataforma a ti."
        />

        {/* Estado 1 — cargando. Con texto, nunca un spinner mudo. */}
        {isPending && (
          <Card className="p-6">
            <p role="status" className="flex items-center gap-3 text-base text-muted-foreground">
              <LoaderCircle
                aria-hidden="true"
                strokeWidth={2}
                className="size-5 shrink-0 animate-spin"
              />
              Cargando tu perfil…
            </p>
          </Card>
        )}

        {/* Estado 2 — error de lectura. Explica y ofrece la acción de salida. */}
        {isError && (
          <Callout variant="destructive" live="assertive" title="No pudimos cargar tu perfil">
            <div className="space-y-4">
              <p>
                {error instanceof Error && error.message
                  ? error.message
                  : 'Revisa tu conexión e inténtalo otra vez.'}
              </p>
              <Button
                variant="outline"
                onClick={() => void refetch()}
                disabled={isRefetching}
                className="h-11 gap-2 px-5 text-base"
              >
                {isRefetching ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      strokeWidth={2}
                      className="size-5 animate-spin"
                    />
                    Cargando tu perfil…
                  </>
                ) : (
                  <>
                    <RotateCw aria-hidden="true" strokeWidth={2} className="size-5" />
                    Volver a cargar
                  </>
                )}
              </Button>
            </div>
          </Callout>
        )}

        {user && (
          <div className="space-y-6">
            {/* Estado 3 — vacío. No dice "sin datos": invita a completarlos. */}
            {withoutPreferences && (
              <Callout variant="info" title="Todavía no indicaste tus preferencias">
                <p>
                  Aún no elegiste tu nivel de hipoacusia ni tu preferencia de comunicación.
                  Indícalos abajo para que adaptemos la plataforma a ti.
                </p>
              </Callout>
            )}

            {/* El email y el rol se muestran, pero no se editan aquí: cambiar el
                email exige verificación por correo y el rol lo decide un
                administrador. Ambos quedan fuera del alcance de esta HU. */}
            <Card className="space-y-1 p-5 sm:p-6">
              <h2 className="text-base font-semibold text-foreground">Datos de tu cuenta</h2>
              <p className="text-base text-muted-foreground">
                Tu email es <span className="text-foreground">{user.email}</span>. Todavía no se
                puede cambiar desde aquí. Escríbenos si necesitas actualizarlo.
              </p>
            </Card>

            {/* `key` con el id: si algún día se cambia de usuario sin desmontar
                la página, el formulario se reinicia con los datos correctos en
                vez de conservar el estado del anterior. */}
            <ProfileForm key={user.id} user={user} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
