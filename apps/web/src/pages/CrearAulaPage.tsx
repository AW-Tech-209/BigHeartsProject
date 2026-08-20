import type { Classroom } from '@academia/types';
import { useNavigate } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { FormularioAula } from '@/features/aulas/components/formulario-aula';
import { useAnnounce } from '@/hooks/use-announce';

/**
 * Crear un aula (HU-201). Solo profesores; el servidor lo vuelve a comprobar y
 * además exige que la cuenta esté `ACTIVE`.
 */
export function CrearAulaPage() {
  const navigate = useNavigate();
  const announce = useAnnounce();

  function alCrear(classroom: Classroom) {
    // B6. El anuncio va ANTES de navegar: al cambiar de ruta,
    // `<PaginaCabecera>` mueve el foco al `<h1>` de la pantalla siguiente, y un
    // mensaje puesto después competiría con ese anuncio. Así el lector de
    // pantalla dice primero qué pasó y luego dónde está.
    announce(`Clase publicada: ${classroom.title}. Ya aparece en tus aulas.`);

    // El destino final es el detalle del aula (`/aulas/:id`), que crea HU-204.
    // Hasta entonces se vuelve a «Mis aulas», que existe y ya lista el trabajo
    // del profesor: mandarlo a una ruta que todavía cae en 404 sería peor que
    // el rodeo.
    navigate('/mis-aulas');
  }

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Crear una clase"
        contexto="Publica una clase con su horario, su cupo y el enlace de la reunión que creaste en Zoom o Meet."
      />

      <FormularioAula onCreada={alCrear} />
    </AppShell>
  );
}
