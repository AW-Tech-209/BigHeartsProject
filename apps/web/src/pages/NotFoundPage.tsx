import { Link } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <AppShell>
      <PaginaCabecera
        titulo="No encontramos esta página"
        tituloDocumento="Página no encontrada"
        contexto="La dirección que abriste no existe o ya no está disponible."
      />

      <EstadoVacio
        ilustracion="no-encontrado"
        titular="Esta dirección no lleva a ninguna parte"
        ayuda="Puede que el enlace esté mal escrito o que la página se haya movido. Vuelve al inicio para seguir desde ahí."
        accion={
          <Button render={<Link to="/" />} className="h-12 px-6 text-base">
            Volver al inicio
          </Button>
        }
      />
    </AppShell>
  );
}
