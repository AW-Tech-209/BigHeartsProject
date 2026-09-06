import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAnnounce } from '@/hooks/use-announce';
import { useTema } from '@/hooks/use-tema';
import { cn } from '@/lib/utils';

/** Botón que alterna entre tema claro y oscuro, en el extremo derecho del `<AppShell>` (HU-216). */
export function SelectorTema({ className }: { className?: string }) {
  const { tema, alternar } = useTema();
  const announce = useAnnounce();
  const esOscuro = tema === 'oscuro';

  function cambiar() {
    alternar();
    announce(esOscuro ? 'Tema claro activado.' : 'Tema oscuro activado.');
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={cambiar}
      aria-pressed={esOscuro}
      aria-label={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className={cn('size-11 shrink-0 rounded-full', className)}
    >
      {esOscuro ? (
        <Moon aria-hidden="true" strokeWidth={2} className="size-5" />
      ) : (
        <Sun aria-hidden="true" strokeWidth={2} className="size-5" />
      )}
    </Button>
  );
}
