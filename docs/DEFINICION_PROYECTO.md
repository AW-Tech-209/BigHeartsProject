# BigHearts — Definición del Proyecto

> **Academia de Inglés para Personas Hipoacúsicas y Sordomudas · Plataforma Digital Especializada**
>
> Visión, problemática, alcance y propuesta de valor.

|                     |                                                                                                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estado**          | Fuente de verdad canónica. Se edita aquí.                                                                                                                                                                                           |
| **Responde**        | El **qué** y el **por qué**. El **cómo** vive en [`ARQUITECTURA.md`](./ARQUITECTURA.md).                                                                                                                                            |
| **Última revisión** | 2026-08-14 (auditoría contra el repo)                                                                                                                                                                                               |
| **Origen**          | Portado desde `BigHearts_Definicion_Proyecto.docx` (v1.0). Ese `.docx` queda como **snapshot histórico** y no vuelve a sincronizarse. Si hace falta un `.docx` pulido para alguien no técnico, se genera desde aquí en ese momento. |

Los cambios no triviales respecto al `.docx` original están marcados en el texto con
`> **Nota de auditoría**` y resumidos al final, en [§10](#10-registro-de-la-auditoría-2026-08-14).

---

## 1. Qué es BigHearts

> **En una frase.** BigHearts es una plataforma digital de academia de inglés diseñada
> específicamente para personas hipoacúsicas y sordomudas, que convierte la enseñanza dispersa por
> WhatsApp en un espacio propio, ordenado y accesible, donde cada clase tiene su cupo, su registro
> y su acceso controlado.

BigHearts no es "una plataforma de videollamadas más". El video es solo el medio; el producto es
todo lo que rodea a la clase: quién puede entrar, cuántos caben, quién asistió, cómo se entera el
estudiante, y sobre todo, que toda esa experiencia esté construida desde el primer píxel pensando
en personas que no oyen.

Hoy la academia funciona, pero funciona a pulso: el profesor crea la reunión por su cuenta y
reparte el enlace por WhatsApp. Eso significa que no existe la academia como espacio: existe un
grupo de chat. BigHearts le da a la academia un lugar propio donde ocurrir.

### 1.1 Qué NO es BigHearts

Definir los límites evita malentendidos con el cliente y con el propio equipo:

- **No es un sustituto de Zoom o Google Meet.** La videollamada sigue ocurriendo en esas
  herramientas; BigHearts controla el acceso a ella.
- **No es una red social ni un chat.** La comunicación informal seguirá existiendo; lo que se
  ordena es la gestión de clases.
- **No es un LMS genérico.** No busca competir con Moodle o Classroom, sino resolver un caso muy
  concreto para una audiencia muy concreta.
- **No es (todavía) una plataforma de contenido tipo Duolingo ni un traductor de lengua de señas.**
  Eso llega en fases posteriores, pero no en la primera entrega.

---

## 2. La problemática que resuelve

La academia opera hoy de forma manual y descentralizada. El profesor abre una reunión en Zoom o
Meet y comparte el enlace por WhatsApp. Esa práctica, aparentemente inofensiva, arrastra una cadena
de problemas concretos.

### 2.1 Los problemas de fondo

- **No hay control de acceso ni de cupos.** Cualquiera que tenga el enlace entra a la clase, lo
  haya reservado o no. El profesor no sabe cuántos van a llegar ni puede limitar el aforo para
  mantener la calidad pedagógica.
- **No hay registro formal de nada.** No queda constancia de quién asistió, ni historial de clases
  dadas o tomadas. Sin registro no hay seguimiento del progreso ni respaldo administrativo.
- **La academia no existe como espacio propio.** Sin plataforma, no hay marca, no hay identidad, no
  hay percepción de servicio profesional. El valor que la academia entrega queda invisible.
- **No es posible monetizar ni licenciar de forma ordenada.** Sin control de acceso no hay manera
  de cobrar por él. El modelo de negocio queda bloqueado por la propia informalidad del sistema.
- **No hay material de apoyo ni seguimiento centralizado.** Todo vive disperso en chats. El
  estudiante no tiene un lugar al que volver.

### 2.2 El problema que nadie nombra: la accesibilidad

> **La capa invisible del problema.** Las herramientas genéricas están diseñadas para personas
> oyentes. Los avisos por sonido, las notificaciones sonoras, la dependencia del audio y las
> interfaces pensadas sin contraste ni claridad visual convierten cada paso en una barrera
> adicional para un estudiante hipoacúsico o sordomudo. El estudiante no solo enfrenta la
> dificultad de aprender inglés: enfrenta además la fricción de usar herramientas que no fueron
> pensadas para él. **BigHearts existe para eliminar esa segunda barrera.**

### 2.3 Antes y después

| Hoy — WhatsApp y enlaces sueltos               | Con BigHearts                                                 |
| ---------------------------------------------- | ------------------------------------------------------------- |
| El enlace circula libre; entra quien lo tenga. | Solo entra quien reservó, y solo 30 minutos antes.            |
| El profesor no sabe cuántos vendrán.           | El profesor ve su lista de inscritos antes de la clase.       |
| No queda registro de asistencia.               | Cada sesión deja historial para estudiante y profesor.        |
| El estudiante depende de revisar el chat.      | Recibe confirmaciones y recordatorios por email.              |
| Las herramientas asumen que el usuario oye.    | Toda la experiencia es visual, clara y accesible.             |
| No hay forma ordenada de cobrar.               | La base de control de acceso habilita la monetización futura. |

---

## 3. A quién ayuda BigHearts

El sistema contempla tres roles de usuario, cada uno con una necesidad distinta que la plataforma
resuelve:

| Rol               | Quién es                                            | Qué gana con BigHearts                                                                                                                                                             |
| ----------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estudiante**    | Persona hipoacúsica o sordomuda que aprende inglés. | Encuentra clases de su nivel, reserva su cupo con certeza, accede a la clase sin depender de un chat, y lleva registro de su propio avance — todo en una interfaz pensada para él. |
| **Profesor**      | Docente que imparte clases en aulas virtuales.      | Crea y gestiona sus aulas con cupo controlado, sabe de antemano quiénes asistirán, registra asistencia y deja de administrar su clase a mano por WhatsApp.                         |
| **Administrador** | Operador interno de la academia.                    | Controla quién puede enseñar en la plataforma mediante aprobación de profesores, y gestiona la operación global del servicio.                                                      |

> **Nota de auditoría — aprobación de profesores.** El `.docx` original presentaba la aprobación
> como una regla fija; el documento de arquitectura la describía como "flag configurable". El
> código ya zanjó la discusión: existe la variable de entorno `TEACHER_APPROVAL_REQUIRED`, con
> valor **`true` por defecto**. Es decir: **por defecto sí se exige aprobación**, y se puede
> desactivar por configuración sin tocar código. Los estudiantes nunca requieren aprobación.

### 3.1 El beneficiario central

Aunque hay tres roles, el eje del producto es **el estudiante hipoacúsico o sordomudo**. Toda
decisión de diseño se juzga contra una pregunta: ¿esto le hace la vida más fácil o más difícil a
esa persona? Los otros roles existen para que ese estudiante tenga una buena clase.

> **El sentido del nombre.** BigHearts nace de una premisa simple: aprender un idioma no debería
> ser más difícil por no poder oír. La plataforma no "adapta" una herramienta genérica para
> personas sordas; se construye desde el principio para ellas. Esa es la diferencia entre
> accesibilidad como añadido y accesibilidad como fundamento.

---

## 4. Qué hará BigHearts

Descrito por el ciclo de vida completo de una clase, que es lo que la plataforma gestiona de punta
a punta.

### 4.1 El recorrido del estudiante

1. Se registra indicando su nivel de hipoacusia y su preferencia de comunicación, para que la
   plataforma se adapte a él.
2. Explora las clases disponibles filtrando por nivel de inglés y horario.
3. Reserva su cupo, con la garantía de que ese lugar es suyo y de que nadie puede ocuparlo por
   encima del aforo.
4. Recibe confirmación y recordatorios por email: al reservar, 24 horas antes y 30 minutos antes.
5. Accede a la clase cuando el enlace se habilita, 30 minutos antes del inicio.
6. Consulta su historial de clases reservadas, asistidas y canceladas.

### 4.2 El recorrido del profesor

1. Se registra y espera la aprobación del administrador para poder enseñar.
2. Crea sus aulas virtuales: nombre, descripción, nivel, horario, duración y cupo máximo.
3. Pega el enlace de la reunión que él mismo generó en Zoom o Meet.
4. Ve la lista de estudiantes inscritos antes de la clase y prepara su sesión.
5. **Marca la asistencia al terminar**, dejando registro formal.

> **Nota de auditoría — asistencia.** El documento de arquitectura afirmaba que el sistema
> registraría la asistencia automáticamente al revelarse el enlace. Con enlace manual de Zoom/Meet
> eso mide "vio el enlace", no "asistió", y contradecía a este documento. **Decisión: en Fase 1 la
> asistencia es manual, la marca el profesor al terminar la clase**, y es la única fuente de
> verdad del historial.

### 4.3 Las reglas que hacen la diferencia

Cuatro reglas de negocio concentran el valor diferencial del producto. Su especificación técnica
está en [`ARQUITECTURA.md` §4](./ARQUITECTURA.md#4-reglas-de-negocio--fase-1).

1. **El enlace es privado y temporal.** Se guarda cifrado y solo se revela a estudiantes con
   reserva confirmada, dentro de los **30 minutos** previos a la clase. Es el corazón del control
   de acceso.
2. **El cupo es real y se respeta bajo concurrencia.** Si dos estudiantes intentan tomar el último
   lugar al mismo tiempo, exactamente uno lo obtiene. Nunca se vende de más.
3. **Cancelar libera el cupo automáticamente.** Si un estudiante no puede asistir y cancela **hasta
   1 hora antes** de la clase, su lugar vuelve a estar disponible para otro. El aforo se aprovecha.
4. **Un estudiante no puede reservar dos clases que se solapen.** El historial refleja algo que
   pudo ocurrir de verdad.

> **Nota de auditoría — reglas 3 y 4.** La ventana de cancelación aparecía en el documento de
> arquitectura como un ejemplo (`e.g. 1 hora antes`), no como decisión. Queda fijada en **1 hora**,
> configurable por entorno. La regla de no solapamiento existía solo en el documento de
> arquitectura y no estaba en el alcance de este documento; **queda incorporada al alcance de
> Fase 1** y se sube a regla diferencial, porque sostiene la fiabilidad del historial.

**Una quinta regla, de integridad y no diferencial: el aula publicada tiene que ser posible.** Un
profesor no puede tener dos clases suyas a la misma hora —nadie está en dos videollamadas a la vez—,
una clase no puede durar más de **4 horas**, y publicar con menos de **1 hora** de antelación abre un
aviso que el profesor puede confirmar, porque por debajo de eso las promesas de las reglas 1 y de
los recordatorios no se pueden cumplir. Las tres son configurables por entorno y se detallan en
[`ARQUITECTURA.md` §4.4](./ARQUITECTURA.md#44-no-solapamiento). No están en la lista de arriba a
propósito: no venden el producto, evitan que se rompa.

---

## 5. Alcance de la Fase 1

La Fase 1 se llama **Gestión de Aulas Virtuales** y es la primera entrega funcional al cliente. Su
objetivo es que la academia pueda dejar de operar por WhatsApp desde el primer día.

### 5.1 Dentro del alcance

- Registro y autenticación de estudiantes, profesores y administrador, con perfil de accesibilidad.
- Aprobación de profesores por parte del administrador antes de que puedan crear aulas
  (activa por defecto, desactivable por configuración).
- Creación, edición y cancelación de aulas virtuales con nivel, horario, duración y cupo máximo.
- Listado de aulas disponibles con filtros por nivel y horario, y vista de detalle.
- Sistema de reservas con control de cupos y de concurrencia, cancelación hasta 1 hora antes con
  liberación automática del cupo, y **bloqueo de reservas con horario solapado**.
- Acceso controlado al enlace de videollamada (solo con reserva y dentro de la ventana de 30
  minutos), con el enlace **cifrado en reposo**.
- Notificaciones por email: confirmación, cancelación y recordatorios (24 h y 30 min antes).
- Historial de clases para estudiante y profesor, y **marcado manual de asistencia por el profesor**.
- **Cada aula declara cómo se imparte:** en qué modos de comunicación (lengua de señas, lectura
  labial, texto escrito, audio), si hay intérprete, subtítulos en vivo o materiales visuales, y a
  qué plataforma de videollamada apunta. El catálogo lo muestra, permite filtrar por ello y
  **destaca** las clases que coinciden con la preferencia del estudiante.
- **Cada rol ve lo suyo:** el estudiante explora el catálogo; el profesor tiene su listado de aulas
  propias, incluidas canceladas y pasadas; el administrador supervisa **todas las aulas de la
  academia**, de todos los profesores, en solo lectura.

> **Nota de auditoría (2026-08-20) — la accesibilidad declarada del aula.** No estaba en ninguna
> parte: el estudiante declaraba su preferencia de comunicación al registrarse y ese dato **no se
> usaba en el producto**. El catálogo filtraba por nivel y horario, exactamente igual que lo haría
> una academia de inglés para oyentes. Un estudiante cuya lengua es de señas no tenía forma de
> saber qué clase podía seguir sin reservarla y entrar a la videollamada — es decir, la fricción
> que este producto existe para eliminar. Se implementa en HU-211.

> **Nota de auditoría (2026-08-20) — ampliación del alcance.** La supervisión global del
> administrador **no estaba en esta lista**. Se añade porque §3 promete que ese rol «gestiona la
> operación global del servicio» y, tal como estaba el alcance, no podía ver ni una sola clase: el
> catálogo le mostraba lo mismo que a un estudiante. Era una incoherencia entre lo que el documento
> dice del rol y lo que el rol podía hacer. Se implementa en HU-210, en solo lectura: el
> administrador **no** edita ni cancela el trabajo de un profesor en Fase 1.

### 5.2 Fuera del alcance de esta fase

Explícitamente aplazado, para evitar expectativas equivocadas:

- Generación automática del enlace de videollamada por API (Zoom, Meet, Daily.co). En Fase 1 el
  profesor lo crea y lo pega manualmente.
- **Aulas recurrentes.** El modelo de datos conserva el gancho (`isRecurring`) pero no hay regla de
  recurrencia, ni generación de instancias, ni edición de serie. Llega en Fase 1.5.
- Pagos, suscripciones y licenciamiento (Fase 1.5).
- Contenido interactivo, lecciones, quizzes y gamificación (Fase 2).
- Inteligencia artificial y traducción de lengua de señas (Fase 3).
- Notificaciones push y SMS (fases posteriores).

> **Nota de auditoría — recurrencia.** El documento de arquitectura prometía aulas recurrentes en
> Fase 1 ("todos los martes a las 6pm"), su propio modelo de datos las dejaba "para futuro", y este
> documento no las incluía en el alcance. Tres versiones distintas. **Decisión: quedan fuera de
> Fase 1**, conservando el campo `isRecurring` como gancho documentado.

> **Por qué el enlace se sube a mano en la Fase 1.** Integrar la API de una plataforma de video
> añade complejidad, costo y dependencia externa, sin aportar al valor diferencial real del
> producto. Ese valor está en el control de acceso, la gestión de cupos y la experiencia accesible
> — no en quién genera el enlace. Simplificar aquí permite entregar antes lo que de verdad importa,
> y la integración automática queda disponible como mejora natural en Fase 1.5.

### 5.3 Estado actual de la Fase 1

> **Nota de auditoría — sección nueva.** El `.docx` no registraba avance. Como este documento pasa
> a vivir en el repo, conviene que diga en qué punto está. Actualízalo al cerrar cada HU.

| Bloque                                                                   | Estado                                                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Sprint 0 — Fundación técnica (monorepo, Docker, CI/CD, deploy a staging) | ✅ Completo                                                             |
| Sprint 1 — Autenticación y usuarios                                      | 🔄 En curso (registro y login/refresh entregados; perfil en desarrollo) |
| Sprint 2 — Gestión de aulas                                              | ✅ Cerrado (2026-08-25) — 15 HUs                                        |
| Sprint 3 — Sistema de reservas                                           | 🔄 Planificado — 7 HUs (HU-301…307), ~11.5 días                         |
| Sprint 4 — Notificaciones e historial                                    | ⬜ Sin empezar                                                          |

El backlog vivo con el detalle de cada historia está en [`docs/historias/`](./historias/).

---

## 6. Visión de producto y hoja de ruta

BigHearts se construye por fases, cada una con valor entregable por sí misma. La arquitectura de la
Fase 1 se diseñó ya pensando en soportar las siguientes sin reescrituras.

| Fase         | Nombre                        | Qué aporta                                                                                                                                                                              |
| ------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 1**   | Gestión de Aulas Virtuales    | La academia deja de operar por WhatsApp: aulas, reservas, acceso controlado, historial y notificaciones.                                                                                |
| **Fase 1.5** | Monetización y Licenciamiento | Pagos para estudiantes, licenciamiento para profesores, suscripciones o créditos de clase. Habilita el modelo de negocio. Incluye aulas recurrentes y generación automática del enlace. |
| **Fase 2**   | Contenido Interactivo         | Lecciones, quizzes y quests estilo Duolingo, con progreso y gamificación. La plataforma pasa de gestionar clases a enseñar.                                                             |
| **Fase 3**   | IA y Lenguaje de Señas        | Texto a señas con avatar animado, reconocimiento de señas por cámara y asistente inteligente de aprendizaje.                                                                            |

### 6.1 La ambición a largo plazo

La Fase 3 es donde BigHearts se vuelve único. Una plataforma que traduzca entre texto y lengua de
señas mediante inteligencia artificial no es una mejora incremental: es una herramienta que cambia
cómo una persona sorda accede al aprendizaje de idiomas. Las fases anteriores construyen la base de
usuarios, el contenido y la confianza necesarios para llegar ahí.

Por eso la Fase 1 no es un experimento desechable: es el cimiento del producto final. Cada decisión
técnica se tomó para que las fases siguientes se apoyen encima sin demoler nada.

---

## 7. Principios rectores del proyecto

Estos principios no son decoración: son los criterios con los que se resuelven las decisiones
difíciles cuando hay que elegir entre dos caminos.

1. **La accesibilidad es el producto, no una característica.** Si una decisión mejora una métrica
   pero empeora la experiencia de un usuario sordo, la decisión es incorrecta. Toda interfaz debe
   ser navegable por teclado, legible por lector de pantalla, de alto contraste, y jamás depender
   del sonido para transmitir información.
2. **Control de acceso antes que funcionalidad vistosa.** El valor central frente a WhatsApp es que
   aquí el acceso se controla. Cualquier funcionalidad que debilite ese control (enlaces filtrados,
   cupos que se saltan, permisos laxos) contradice la razón de ser del producto.
3. **Simplicidad deliberada en la Fase 1.** Se prefiere entregar bien poco que entregar mal mucho.
   El enlace manual es el ejemplo: se sacrifica automatización para ganar velocidad y foco en lo
   que sí diferencia.
4. **Construir para las fases siguientes desde hoy.** La arquitectura modular, los tipos
   compartidos y la separación por dominios existen para que Fase 2 y Fase 3 se agreguen encima, no
   para lucirse. Nada de lo que se construya hoy debería tener que demolerse mañana.
5. **Confianza del usuario como activo frágil.** Una audiencia vulnerable confía en la plataforma
   con sus datos y su tiempo. Un fallo de seguridad, una clase perdida por un bug o una interfaz
   confusa cuestan mucho más que en un producto genérico.

---

## 8. Cómo sabremos que funcionó

Criterios de éxito para la Fase 1, en orden de importancia:

| Criterio de éxito                                                                       | Cómo se verifica                                             |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Un estudiante hipoacúsico completa el flujo completo solo, sin ayuda y sin frustración. | Pruebas de usabilidad con usuarios reales de la academia.    |
| La academia deja de repartir enlaces por WhatsApp.                                      | La operación real migra a la plataforma tras la entrega.     |
| Ningún estudiante sin reserva accede a una clase.                                       | Verificación de las reglas de acceso y pruebas de seguridad. |
| Nunca se sobrepasa el cupo de un aula.                                                  | Pruebas de concurrencia sobre el sistema de reservas.        |
| Profesores y estudiantes tienen registro fiable de sus clases.                          | Historial y asistencia consistentes con lo ocurrido.         |
| El profesor gestiona su clase sin soporte técnico.                                      | Adopción autónoma tras una breve inducción.                  |

### 8.1 El indicador que más importa

> **La prueba definitiva.** Si un estudiante sordo entra a la plataforma, encuentra su clase,
> reserva y llega a la videollamada sin pedirle ayuda a nadie, el producto funcionó. Ninguna
> métrica técnica sustituye a esa observación.

### 8.2 Riesgos y supuestos a vigilar

- **Acceso a usuarios reales para validar.** El mayor riesgo del proyecto es construir la
  accesibilidad "a ciegas". Debe acordarse con el cliente el acceso a estudiantes de la academia
  para pruebas antes de terminar el desarrollo.
- **Adopción por parte de los profesores.** Si el profesor percibe la plataforma como más trabajo
  que WhatsApp, no la usará. La creación de un aula debe ser rápida y evidente.
- **Equipo reducido.** El desarrollo lo ejecutan dos personas, con reparto por capa: **Dev A** el
  backend (`apps/api`) y **Dev B** el frontend (`apps/web`). El contrato entre ambos vive en
  `packages/types` y en [`AUTH_FLOW.md`](../AUTH_FLOW.md). El alcance de cada fase debe mantenerse
  disciplinado para no comprometer la calidad.
- **Dependencia de plataformas externas de video.** En Fase 1 la calidad de la videollamada depende
  de Zoom o Meet, fuera del control de BigHearts.
- **Deriva entre documentación y código.** Ya ocurrió una vez: los documentos originales quedaron
  desalineados del repo (ver §10). El proceso para evitar que se repita está en
  [`GUIA_FLUJO.md`](../GUIA_FLUJO.md).

---

## 9. Documentos del proyecto

> **Nota de auditoría — sección reescrita.** El `.docx` listaba documentos que no existen como
> archivos del repo. Esta tabla refleja lo que hay de verdad hoy.

| Documento                              | Qué responde                                                                                  | Dónde                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------ |
| **Definición del Proyecto** (este)     | Qué es BigHearts, a quién ayuda, qué problema resuelve y hasta dónde llega.                   | `docs/DEFINICION_PROYECTO.md`  |
| **Arquitectura de Sistema**            | Cómo está construido: stack, decisiones técnicas, modelo de datos, módulos e infraestructura. | `docs/ARQUITECTURA.md`         |
| **Historias de Usuario**               | Qué se construye exactamente y en qué orden, con tasks y criterios de aceptación.             | `docs/historias/`              |
| **Guía del flujo de trabajo**          | Cómo se opera el proyecto con Claude Code de punta a punta.                                   | `GUIA_FLUJO.md`                |
| **Contexto permanente de Claude Code** | Comandos, estructura y no-negociables que se cargan en toda sesión.                           | `CLAUDE.md`                    |
| **Convenciones de UI/UX**              | Color, tipografía, accesibilidad, patrones de componentes y microcopy.                        | `.claude/skills/bighearts-ui/` |
| **Flujo de autenticación**             | Contrato de tokens entre backend y frontend.                                                  | `AUTH_FLOW.md`                 |
| **Despliegue**                         | Render, Vercel, Supabase, secretos y protección de rama.                                      | `DEPLOYMENT.md`                |
| **Puesta en marcha local**             | Instalación, Docker, scripts y trampas conocidas.                                             | `README.md`                    |

**Orden de lectura para alguien que se incorpora:** este documento → `ARQUITECTURA.md` →
`GUIA_FLUJO.md` → la HU que vaya a implementar.

La "Guía de Polish y Hardening" que mencionaba el `.docx` original **no existe en el repo**. Si se
necesita, se crea como documento propio; hasta entonces, la definición de terminado vive en el
skill `bighearts-dod`.

---

## 10. Registro de la auditoría (2026-08-14)

Cambios no triviales aplicados al portar el `.docx` a este archivo, con su motivo. Nada aquí se
cambió en silencio.

| #   | Cambio                                                                                            | Por qué                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Aprobación de profesores documentada como **configurable, activa por defecto** (§3).              | El código ya tiene `TEACHER_APPROVAL_REQUIRED` con default `true`. El `.docx` la daba por fija y el doc de arquitectura por opcional.            |
| 2   | Asistencia fijada como **manual del profesor** (§4.2, §5.1).                                      | Arquitectura §4.4 decía "automática al acceder al enlace", contradiciendo a este documento y a la HU-404. Con enlace manual no hay señal fiable. |
| 3   | Ventana de cancelación fijada en **1 hora, configurable por entorno** (§4.3).                     | Arquitectura la daba como ejemplo (`e.g. 1 hora`), no como decisión. Una regla de negocio no puede ser un ejemplo.                               |
| 4   | **No solapamiento** de reservas incorporado a las reglas diferenciales y al alcance (§4.3, §5.1). | Existía solo en el doc de arquitectura, sin respaldo en el alcance. Sostiene la fiabilidad del historial, así que sube de nivel.                 |
| 5   | **Aulas recurrentes movidas explícitamente fuera de Fase 1** (§5.2).                              | Tres versiones contradictorias entre los dos documentos y el modelo de datos.                                                                    |
| 6   | Añadido que el enlace va **cifrado en reposo** al alcance (§5.1).                                 | Ambos documentos lo prometían en prosa pero nunca aparecía en la lista de alcance.                                                               |
| 7   | Sección **§5.3 Estado actual** (nueva).                                                           | El documento vive ahora en el repo; debe poder decir en qué punto está la fase.                                                                  |
| 8   | Reparto **Dev A / Dev B** documentado (§8.2).                                                     | Era visible en el CI y en `AUTH_FLOW.md` pero no estaba escrito en ningún documento de proyecto.                                                 |
| 9   | Riesgo de **deriva documentación ↔ código** añadido (§8.2).                                       | Es el riesgo que esta misma auditoría acaba de materializar.                                                                                     |
| 10  | **§9 reescrita** contra los archivos reales del repo.                                             | Listaba documentos inexistentes ("Guía de Polish y Hardening") y omitía todos los que sí existen.                                                |
| 11  | Fase 1.5 ampliada con recurrencia y enlace automático (§6).                                       | Consecuencia de sacarlos de Fase 1: tienen que aterrizar en algún sitio.                                                                         |

**Sin cambios de fondo:** §1, §2, §6.1, §7 y §8 se mantienen tal como estaban. El diagnóstico no
encontró motivo para tocarlos.
