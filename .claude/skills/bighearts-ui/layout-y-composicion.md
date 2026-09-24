# Layout y composición

El código es la fuente de verdad de clases y medidas: **reutiliza el componente existente** en vez
de copiar valores de aquí.

## Shell (`<AppShell>`, `components/layout/`)

- Barra superior sobre `bg-brand`; **nunca** barra lateral ni hamburguesa en escritorio.
- Destinos: estudiante Panel · Aulas · Mis clases · Historial — profesor Panel · Aulas · Mis aulas ·
  Historial — admin Panel · Aulas. El perfil se abre desde la ficha de cuenta, no es un destino.
- Activo con borde de 2px, no solo color. Bajo `lg` (1024px): barra inferior fija con ícono + texto.
- `<SkipLink>` primero, `<main id="contenido" tabIndex={-1}>` como destino.
- Sin sesión (login, registro, recuperación): `<LayoutAutenticacion>` con `<PanelDeMarca>`, sin shell.

## Página

1. `<PaginaCabecera>`: único `<h1>` (serif), línea de contexto, acción principal opcional.
2. Controles: filtros siempre visibles, nunca dentro de desplegables.
3. Contenido. Contenedor `mx-auto max-w-6xl px-4 sm:px-6`. Ritmo: 32px entre bloques, 16px dentro.

Una sola acción primaria por pantalla.

## Qué componente usar

| Necesitas…                         | Usa                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Lista de aulas para elegir         | `<ListaAulas>` + `<TarjetaAula>` (renglón ancho)                                                |
| Aulas compactas en un tablero      | `<RejillaAulas>` (1/2/3 columnas, nunca 4)                                                      |
| Lista para administrar o consultar | `<FilaLista>` (historial, supervisión)                                                          |
| Tabla que debe verse en móvil      | Filas que se apilan como tarjeta bajo `sm`, con roles ARIA explícitos. Nunca barrido horizontal |
| Vacío                              | `<EstadoVacio>`: ilustración → titular → ayuda → botón                                          |

`<TarjetaAula>`: riel de estado de 4px a la izquierda, zonas cuándo · qué · cupo · acción, una sola
acción como `<Button>`. Las etiquetas que no caben colapsan tras un botón `+N`.

## Reglas

- **Regla del sólido:** solo `acceso-abierto` (ámbar) y `en-curso` (verde) van en color pleno.
- Ilustraciones solo en vacíos y onboarding, geométricas, con tokens, `role="img"` + `aria-label`,
  sin información que no esté en texto.
- Espaciados de la escala, nunca arbitrarios.
