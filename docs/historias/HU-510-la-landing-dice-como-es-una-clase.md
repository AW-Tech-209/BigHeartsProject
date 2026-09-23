# HU-510 — La landing dice cómo es una clase de verdad

| Campo               | Valor                                                        |
| ------------------- | ------------------------------------------------------------ |
| **Sprint**          | Post-Fase 1 · Auditoría                                      |
| **Prioridad**       | 🟠 Alta                                                      |
| **Estimación**      | 1 día                                                        |
| **Estado**          | ⬜ Pendiente                                                 |
| **Asignada a**      | **Dev A** — frontend, acotado a `features/landing/`(William) |
| **Rama**            | `hu-510-la-landing-dice-como-es-una-clase-a`                 |
| **Alcance técnico** | frontend                                                     |
| **Depende de**      | **HU-505 mergeada**                                          |
| **Labels**          | `post-fase-1` `prioridad:alta` `frontend`                    |

> **Como** persona que llega a bigheartsacademy.co,
> **Quiero** entender en treinta segundos cómo es una clase y dónde ocurre,
> **Para** no formarme una idea equivocada del producto.

## Contexto

**La auditoría del socio es la prueba de que este problema existe.** Su hallazgo #1, uno de los dos
críticos, dice que no hay «ninguna lección con video, subtítulos activos, ejercicio de pronunciación
o escritura» y pide grabar una lección con subtítulos.

Eso no existe ni existirá: la clase ocurre en Zoom o Meet, y BigHearts gestiona acceso, cupos,
reservas, recordatorios e historial. Está declarado en `DEFINICION_PROYECTO.md` §1.1 desde el
principio.

**Pero la landing no lo dice donde hay que decirlo.** La única frase que lo menciona —«pegas tu
enlace de Zoom o Meet»— está en la sección de profesores, cerca del final. Alguien que se forma una
idea del producto mirando la parte de arriba se queda sin ese dato.

Si un auditor profesional, leyendo con atención y con un framework en la mano, salió creyendo que
esto es una plataforma de lecciones, **un estudiante también puede**. Y eso es precisamente lo que
el documento de marca llama promesa falsa: alguien que llega esperando subtitulado automático y
encuentra una plataforma de reservas se lleva la decepción que este producto existe para evitar.

### Lo que hay que añadir

1. **Un bloque «Cómo es una clase», arriba**, antes de las funciones: el profesor crea el aula, tú
   reservas, el enlace aparece 30 minutos antes, y **la clase ocurre en Zoom, Meet o Teams**.
2. **El estándar de la academia, dicho en voz alta.** Con HU-506, toda clase se imparte en LSC o con
   intérprete de LSC. Eso no es letra pequeña: es el mayor argumento del producto y hoy no está en
   la landing.
3. **Qué no es BigHearts**, breve y sin complejo: no hay lecciones grabadas, ni ejercicios de
   pronunciación, ni app. Decirlo ahorra la decepción y, de paso, ahorra la próxima auditoría
   equivocada.

## Dependencias técnicas

- **Fuente del copy:** `docs/BigHearts-Marca-y-Producto.md` — Parte V (lo que hace hoy y lo que no)
  y Parte VI (estructura de la landing, con el aviso sobre «declara» frente a «ofrece»).
- **Reglas:** `bighearts-ui` → `voz-microcopy.md`. Prohibido texto sobre imagen o degradado.
- **Archivos:** **solo `apps/web/src/features/landing/`.** Dev B no lo toca en HU-507; es la
  frontera que mantiene las dos ramas sin conflicto.
- **Decisiones pendientes:** ninguna.

> **La palabra que decide el bloque de accesibilidad: «declara».** La plataforma **no provee**
> intérprete ni subtítulos — los declara el profesor, clase por clase. Escribir «incluye» u «ofrece»
> sería exactamente la promesa falsa que el resto del documento evita.

## 🔧 Tasks

### Frontend

- [x] **T1** — Bloque **«Cómo es una clase»** entre el héroe y las funciones, con los cuatro pasos y
      **dónde ocurre la clase dicho con todas las letras**.
- [x] **T2** — Bloque del **estándar de la academia**: toda clase se imparte en LSC o con intérprete
      de LSC, y los apoyos —lectura labial, texto, subtítulos, materiales— son añadidura. Usar
      **«Lengua de Señas Colombiana (LSC)»**, nunca «lengua de signos».
- [x] **T3** — Bloque **«Qué no es BigHearts»**: sin lecciones grabadas, sin ejercicios de
      pronunciación, sin app.
- [x] **T4** — Revisar la landing entera contra la Parte VI del documento de marca y **retirar toda
      afirmación que no se pueda trazar** a una función que existe.
- [x] **T5** — Barrer «Lengua de signos» de la landing y de sus tests.
- [x] **T6** — Tests: los tres bloques se encuentran por encabezado; la landing nombra Zoom, Meet o
      Teams por encima del pliegue; `axe` limpio.

### Documentación

- [x] **T7** — Actualizar la Parte VI del documento de marca con la estructura final, para que el
      documento y la landing no vuelvan a divergir.

## ✅ Criterios de aceptación

- [x] **AC1** — La landing dice **dónde ocurre la clase** —Zoom, Meet o Teams— en un bloque propio,
      **antes** de la sección de profesores.
- [x] **AC2** — El estándar de LSC o intérprete aparece como **argumento destacado**, no como
      detalle técnico.
- [x] **AC3** — La landing dice qué no es BigHearts —sin lecciones grabadas, sin ejercicios de
      pronunciación, sin app— y no promete algo que no existe.
- [x] **AC4** — Ni una «Lengua de signos» en toda la landing. Verificado buscando en el código.
- [x] **AC5** — El bloque de accesibilidad dice **«declara»**, nunca «incluye» ni «ofrece».
- [x] **AC6** — **Accesibilidad y verificación:** `axe` limpio, y `typecheck`, `lint`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **Cualquier archivo fuera de `features/landing/`.** El resto del frontend es de Dev B.
- **Fotos o video de personas sordas reales** (hallazgo #6). No hay material; queda abierto para
  cuando lo haya.
- **Rediseñar** la landing. Se añaden bloques y se corrige copy.
- **Traducirla** a LSC en video. Sería lo coherente con el framework y hoy no hay con qué.

## Notas de implementación

_Se rellena al cerrar._
