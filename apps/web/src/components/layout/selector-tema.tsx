import { NativeSelect } from '@/components/ui/native-select';
import { useAnnounce } from '@/hooks/use-announce';
import { TEMAS, useTema, type Tema } from '@/hooks/use-tema';

const ETIQUETAS: Record<Tema, string> = {
  claro: 'Tema claro',
  oscuro: 'Tema oscuro',
  'alto-contraste': 'Tema de alto contraste',
};

/** Selector de tema visual (claro/oscuro/alto contraste) del `<AppShell>` (HU-216). */
export function SelectorTema() {
  const { tema, setTema } = useTema();
  const announce = useAnnounce();

  function cambiar(siguiente: Tema) {
    setTema(siguiente);
    announce(`${ETIQUETAS[siguiente]} activado.`);
  }

  return (
    <label className="flex shrink-0 items-center gap-2 text-sm text-foreground">
      <span className="sr-only sm:not-sr-only">Tema</span>
      <NativeSelect
        aria-label="Tema visual"
        value={tema}
        onChange={(e) => cambiar(e.target.value as Tema)}
        className="h-9 w-auto min-w-0 pr-9 pl-3 text-sm"
      >
        {TEMAS.map((opcion) => (
          <option key={opcion} value={opcion}>
            {ETIQUETAS[opcion]}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}
