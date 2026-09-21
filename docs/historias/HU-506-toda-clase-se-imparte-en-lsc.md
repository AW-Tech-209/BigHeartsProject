# HU-506 — Toda clase se imparte en LSC, y el enlace lleva a donde hay subtítulos

| Campo               | Valor                                                       |
| ------------------- | ----------------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Auditoría                                     |
| **Prioridad**       | 🔴 Crítica (es la respuesta al hallazgo de fondo del socio) |
| **Estimación**      | 2 días                                                      |
| **Estado**          | ⬜ Pendiente                                                |
| **Asignada a**      | **Dev A** — backend                                         |
| **Rama**            | `hu-506-toda-clase-se-imparte-en-lsc-a`                     |
| **Alcance técnico** | backend                                                     |
| **Depende de**      | **HU-505 mergeada**                                         |
| **Labels**          | `post-fase-1` `prioridad:critica` `backend` `a11y`          |

> **Como** estudiante sordo,
> **Quiero** que ninguna clase de la academia pueda existir sin decir en qué lengua se imparte,
> **Para** no descubrir al entrar a la videollamada que no voy a poder seguirla.

## Contexto

Hoy un profesor puede publicar un aula con `communicationModes: ['WRITTEN_TEXT']`, enlace a
cualquier plataforma, y la academia la ofrece como clase de inglés para personas sordas. El
framework del socio §2 lo nombra sin rodeos: tratar instrucción, interpretación y texto como
niveles de una misma escala es el error de fondo.

**Esta HU lo hace imposible a nivel de servidor.** La regla no vive en el formulario —donde se
esquiva con una petición directa— sino en el DTO y el servicio, como manda `CLAUDE.md` regla 6.

### Las dos reglas nuevas

1. **Modo de instrucción obligatorio.** `LSC_NATIVA` o `INTERPRETE_LSC`. Sin él no se crea ni se
   publica un aula. Los apoyos —lectura labial, texto escrito, subtítulos, materiales visuales— son
   opcionales y no sustituyen a ninguno de los dos.
2. **El enlace apunta a Zoom, Meet o Teams.** Se valida el dominio con la función pura de HU-505, y
   `meetingProvider` **se deriva del enlace** en vez de que el profesor lo elija: un desplegable que
   puede contradecir a la URL de al lado es un dato que miente.

### Qué pasa con las aulas que ya existen

**No se les inventa un modo.** `ARQUITECTURA.md` §4.9 regla 3 ya decidió este caso en HU-211:
rellenar una migración con un valor por defecto sería mentirle al estudiante sobre algo de lo que
depende para seguir la clase. Así que:

- La migración deja `instructionMode` **nulo** en las aulas anteriores. Siguen vivas y sus reservas
  intactas.
- El catálogo las marca **«Modo de instrucción sin declarar»** (lo pinta HU-507).
- **No se pueden editar ni duplicar** hasta declararlo. Es la fricción que hace que se completen.
- Las aulas **nuevas** lo exigen desde el primer día.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.9 reescrita en HU-505 (D42–D45), regla 6 de `CLAUDE.md` (la
  autorización y la validación se deciden en el servidor).
- **Skills:** `bighearts-backend` → `contrato-api.md` y convenciones de Prisma y DTOs.
- **Reutiliza:** `esProveedorPermitido()` y el mapeo de migración, los dos de HU-505. **No
  reimplementes la validación de dominio en el backend**: es la misma regla que usa el formulario.
- **Archivos:** solo `apps/api/`. **Dev B no toca ninguno de estos.**
- **Decisiones pendientes:** ninguna.

## 🔧 Tasks

### Backend

- [ ] **T1** — Migración de Prisma: `instructionMode` **nullable**, tabla de apoyos, y retirada de
      `communicationModes` y los tres booleanos. **Ninguna fila recibe un modo inventado.**
- [ ] **T2** — Migrar la preferencia del estudiante al vocabulario nuevo con el mapeo de HU-505.
      Quien no tuviera preferencia sigue sin tenerla.
- [ ] **T3** — DTO de crear y editar: modo de instrucción **obligatorio**, apoyos opcionales.
- [ ] **T4** — Validar el enlace con `esProveedorPermitido()` y **derivar `meetingProvider`** de él.
      Un enlace de otra plataforma se rechaza con su código.
- [ ] **T5** — Editar y duplicar un aula **sin modo declarado** responde con el código de aula sin
      declarar, y el mensaje dice qué falta.
- [ ] **T6** — Adaptar `GET /panel/resumen` y el listado de inscritos al vocabulario nuevo: la
      tarjeta «Cómo se comunica tu grupo» del profesor cuenta sobre los valores migrados.
- [ ] **T7** — Tests: crear sin modo → error; enlace de otra plataforma → error; `meetingProvider`
      derivado coincide con el dominio; editar un aula sin declarar → error; la migración no inventa
      modos; el emparejamiento cuadra con los datos del seed.

### Documentación

- [ ] **T8** — Actualizar el seed para que las aulas de demostración declaren modo de instrucción, y
      **dejar al menos una sin declarar** — es el caso que HU-507 tiene que pintar y que no se puede
      probar si no existe.

## ✅ Criterios de aceptación

- [ ] **AC1** — Crear o editar un aula **sin modo de instrucción** se rechaza en el servidor.
      Verificado con un test, no ocultando el formulario.
- [ ] **AC2** — Un enlace que no sea de Zoom, Meet o Teams se rechaza; uno válido guarda el aula y
      **`meetingProvider` queda derivado del dominio**, no de lo que dijera el cliente.
- [ ] **AC3** — Tras la migración, **ninguna aula anterior tiene un modo que nadie declaró**, y sus
      reservas siguen intactas.
- [ ] **AC4** — Editar o duplicar un aula sin modo declarado responde con su código; declararlo la
      desbloquea.
- [ ] **AC5** — El resumen del profesor y la lista de inscritos siguen cuadrando con el vocabulario
      nuevo.
- [ ] **AC6** — **Verificación:** `typecheck`, `lint`, `build` y `npm run test` en verde, y el seed
      incluye al menos un aula sin declarar.

## 🚫 Fuera de alcance

- **Cualquier archivo de `apps/web`.** Es de Dev B en HU-507.
- **Auditar que el profesor cumpla lo que declara.** §4.9 regla 4: la declaración es de buena fe.
- **Comprobar que el enlace funciona** o que los subtítulos están activados en esa reunión. Se
  valida el dominio, no el contenido.
- **Añadir proveedores** más allá de los tres.

## Notas de implementación

_Se rellena al cerrar._
