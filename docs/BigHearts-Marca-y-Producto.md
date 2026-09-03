# BigHearts — Marca y producto

> Documento de fundamento para el design system, la landing page y toda comunicación pública.

**Academia de inglés en línea para personas sordas e hipoacúsicas.**

Este documento describe lo que BigHearts es y lo que hace **hoy**, con la Fase 1 entregada. No
contiene promesas de funciones futuras: todo lo que aparece aquí está construido y verificado, y lo
que no lo está aparece señalado como tal.

| Campo               | Valor                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Versión             | 1.0                                                                                                      |
| Fecha               | Agosto de 2026                                                                                           |
| Estado del producto | Fase 1 — Gestión de Aulas Virtuales, entregada en staging                                                |
| Audiencia           | Equipo de producto y diseño                                                                              |
| Fuentes             | `docs/DEFINICION_PROYECTO.md` · `docs/ARQUITECTURA.md` · skill `bighearts-ui` · `apps/web/src/index.css` |

---

## Cómo usar este documento

| Si vas a…                      | Lee                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Construir el design system     | Partes III y IV: la voz, la paleta con su significado, la tipografía y el diccionario de estados.        |
| Escribir la landing page       | Partes I, V y VI: el relato, lo que el producto hace de verdad y la estructura con el copy ya redactado. |
| Explicarle BigHearts a alguien | Partes I y II: qué es, qué problema resuelve y a quién le sirve.                                         |

### La regla que gobierna todo el documento

> **Cero promesas falsas.**
>
> La plataforma existe para personas que ya cargan con herramientas que no fueron pensadas para
> ellas. Prometerles algo que el producto no hace es repetir esa experiencia desde el lado de la
> marca. Cada afirmación de este documento, y cada frase de la landing que sale de él, es trazable a
> una función que existe y está verificada. El anexo lo demuestra línea por línea.

Este documento no sustituye a los que ya existen:

- `docs/DEFINICION_PROYECTO.md` sigue siendo la fuente de verdad del **qué** y el **porqué**.
- `docs/ARQUITECTURA.md` sigue siendo la del **cómo** técnico.
- El skill `bighearts-ui` sigue siendo la referencia operativa al escribir un componente.

Lo que añade es la capa que ninguno tenía: la marca hacia fuera, y el porqué de las decisiones
visuales que hasta ahora solo vivían como reglas.

---

# Parte I · La marca

## Qué es BigHearts

> **BigHearts es una academia de inglés en línea diseñada específicamente para personas sordas e
> hipoacúsicas, que convierte la enseñanza dispersa por WhatsApp en un espacio propio, ordenado y
> accesible, donde cada clase tiene su cupo, su registro y su acceso controlado.**

BigHearts **no es una plataforma de videollamadas más**. El video es solo el medio; el producto es
todo lo que rodea a la clase: quién puede entrar, cuántos caben, quién asistió, cómo se entera el
estudiante. Y, sobre todo, que toda esa experiencia esté construida desde el primer píxel pensando
en personas que no oyen.

Hoy la academia funciona, pero funciona a pulso: el profesor crea la reunión por su cuenta y reparte
el enlace por WhatsApp. Eso significa que **no existe la academia como espacio, existe un grupo de
chat**. BigHearts le da a la academia un lugar propio donde ocurrir.

## El problema que existe para resolver

Repartir un enlace por WhatsApp parece inofensivo. Arrastra una cadena de problemas concretos:

- Cualquiera con el enlace entra a la clase, lo haya reservado o no. El profesor no sabe cuántos van
  a llegar ni puede limitar el aforo.
- No queda constancia de quién asistió ni historial de clases. Sin registro no hay seguimiento ni
  respaldo administrativo.
- La academia no existe como espacio propio. Sin plataforma no hay marca, no hay identidad, y el
  valor que entrega queda invisible.
- Sin control de acceso no hay forma ordenada de cobrar. El modelo de negocio queda bloqueado por la
  informalidad del sistema.
- Todo vive disperso en chats. El estudiante no tiene un lugar al que volver.

### Y debajo de todo eso, el problema que nadie nombra

> Las herramientas genéricas están diseñadas para personas oyentes. Los avisos por sonido, las
> notificaciones sonoras, la dependencia del audio y las interfaces pensadas sin contraste ni
> claridad visual convierten cada paso en una barrera adicional.
>
> **El estudiante no solo enfrenta la dificultad de aprender inglés: enfrenta además la fricción de
> usar herramientas que no fueron pensadas para él. BigHearts existe para eliminar esa segunda
> barrera.**

## El sentido del nombre

BigHearts nace de una premisa simple: **aprender un idioma no debería ser más difícil por no poder
oír.**

La plataforma no _adapta_ una herramienta genérica para personas sordas; se construye desde el
principio para ellas. Esa es la diferencia entre accesibilidad como añadido y accesibilidad como
fundamento, y es la frase que mejor resume por qué el producto existe.

## El principio rector

Toda decisión de producto, diseño o copy se juzga contra una sola pregunta. Está escrita en la
primera línea del archivo de instrucciones del repositorio y en la primera línea del skill de UI,
porque es la que decide los empates.

> **Si un estudiante sordo entra, encuentra su clase, reserva y llega a la videollamada sin pedirle
> ayuda a nadie, el producto funcionó.**
>
> Ante la duda entre dos opciones, esa es la pregunta que decide.

## Personalidad de marca

Cinco rasgos. No son adjetivos de moodboard: cada uno tiene una consecuencia concreta en el
producto, y por eso se pueden verificar.

| Rasgo                 | Qué significa                                              | Cómo se comprueba                                                                                                |
| --------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Literal               | Dice exactamente lo que pasa, sin metáforas ni ingenio.    | Ningún texto de la interfaz usa lenguaje figurado. Muchos usuarios tienen la lengua de señas como primer idioma. |
| Explícita             | No da nada por supuesto ni por sabido.                     | Las fechas llevan zona horaria. Los estados llevan color, ícono y texto a la vez.                                |
| Serena                | No alarma, no exagera, no felicita de más.                 | Una ausencia se muestra como «No asististe», nunca como error ni reprimenda.                                     |
| Honesta               | Prefiere decir lo que no puede antes que fingir que puede. | Cuando una acción no está disponible se explica por qué, en vez de esconder el botón.                            |
| Respetuosa del tiempo | Cada elemento gana su lugar o se va.                       | Sin decoración: todo color no neutro significa algo.                                                             |

## Qué NO es BigHearts

Definir los límites evita malentendidos con el cliente y con el propio equipo.

- **No es un sustituto de Zoom o Google Meet.** La videollamada sigue ocurriendo ahí; BigHearts
  controla el acceso a ella.
- **No es una red social ni un chat.** La comunicación informal seguirá existiendo; lo que se ordena
  es la gestión de clases.
- **No es un LMS genérico.** No compite con Moodle ni con Classroom: resuelve un caso muy concreto
  para una audiencia muy concreta.
- **No es una plataforma de contenido tipo Duolingo ni un traductor de lengua de señas.** Eso son
  fases posteriores, y hoy no existe.

---

# Parte II · A quién le habla

## Los tres roles

| Rol               | Quién es                                        | Qué gana                                                                                                         |
| ----------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Estudiante**    | Persona sorda o hipoacúsica que aprende inglés. | Encuentra clases de su nivel, reserva con certeza, accede sin depender de un chat y lleva registro de su avance. |
| **Profesor**      | Docente que imparte clases en aulas virtuales.  | Crea y gestiona sus aulas con cupo controlado, sabe de antemano quiénes asistirán y cómo se comunica cada uno.   |
| **Administrador** | Operador interno de la academia.                | Controla quién puede enseñar mediante aprobación de profesores y supervisa la operación completa.                |

## El beneficiario central

Aunque hay tres roles, el eje del producto es **el estudiante sordo o hipoacúsico**. Toda decisión
de diseño se juzga contra una pregunta: ¿esto le hace la vida más fácil o más difícil a esa persona?

> Los otros dos roles existen para que ese estudiante tenga una buena clase. Cuando un requisito del
> profesor y uno del estudiante entran en conflicto, **gana el estudiante**.

## Mensajes por público

El mismo producto, dicho de tres maneras. Ninguna de las tres inventa nada.

**Al estudiante**

> «Tu clase está donde debe estar. Reservas tu cupo, sabes que es tuyo, y entras cuando llega la
> hora — sin buscar el enlace en un chat.»

**Al profesor**

> «Sabes quiénes vienen y cómo se comunica cada uno antes de empezar. Preparas la clase para las
> personas que vas a tener delante, no para un número.»

**A la academia**

> «Deja de existir como grupo de chat y pasa a existir como academia: con control de acceso,
> registro de asistencia y una identidad propia.»

---

# Parte III · La voz

El texto **es** la interfaz. Se escribe con la misma disciplina que el espaciado, y por una razón
que no es estética: en un producto sin audio, todo lo que un producto normal delegaría a un sonido
lo tiene que decir la pantalla.

## Las reglas

| Regla                                                             | Por qué                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Español neutro, sin regionalismos. Frases de máximo ~15 palabras. | La audiencia es diversa y el español escrito suele ser segundo idioma.                                  |
| Literal, nunca figurado.                                          | Muchos usuarios tienen la lengua de señas como primer idioma. «Se nos fue el avión» no se entiende.     |
| Voz activa, y el mismo verbo en todo el flujo.                    | El botón dice «Reservar mi cupo» → el aviso dice «Cupo reservado». Nunca «Enviar» ni «Aceptar» a secas. |
| Los errores explican, no se disculpan.                            | Un «¡Ups!» no dice qué hacer. Un error debe decir qué pasó y cuál es el siguiente paso.                 |
| Los vacíos invitan a actuar.                                      | Una pantalla en blanco se lee como un fallo. Un vacío debe decir cómo dejar de estar vacío.             |
| Sentence case siempre.                                            | Title Case no existe en español y ralentiza la lectura.                                                 |
| Fechas y horas completas, con zona horaria explícita.             | El estudiante no puede permitirse dudar de a qué hora es su clase.                                      |

## Sí y no

| Contexto | Así sí                                                                  | Así no                               |
| -------- | ----------------------------------------------------------------------- | ------------------------------------ |
| Error    | No pudimos guardar tu reserva. Revisa tu conexión e inténtalo otra vez. | ¡Ups! Algo salió mal 😅              |
| Vacío    | Todavía no tienes clases reservadas. Explora las aulas disponibles.     | Sin resultados.                      |
| Fecha    | Martes 12 de agosto, 6:00 p.m. (hora de Colombia)                       | 12/08 · en 2 días                    |
| Ajustes  | Recordatorios por correo                                                | Configuración de notificaciones SMTP |
| Carga    | Cargando aulas disponibles…                                             | Un spinner sin texto                 |
| Ausencia | No asististe                                                            | Faltaste · ⚠ Inasistencia            |

## Dos detalles que parecen menores y no lo son

- **Los avisos duran mínimo 8 segundos y siempre traen botón de cerrar.** El usuario no puede _oír_
  que algo pasó mientras mira otra parte de la pantalla. Los mensajes críticos no se cierran solos.
- **El contenido en inglés va marcado semánticamente.** Es una academia de inglés: el idioma que se
  enseña necesita esa marca para lectores de pantalla y correctores.

---

# Parte IV · El sistema visual

## La regla fundacional: aquí el color no decora

En una interfaz para usuarios oyentes, el color decora y el audio avisa. Aquí el usuario **no recibe
nada por sonido**, así que todo lo que un producto normal delegaría a un «ding» lo tiene que decir
la pantalla.

De ahí salen tres reglas que no se negocian, y de ellas sale todo lo demás de esta parte:

1. **Nada de color decorativo.** Todo color no neutro significa algo, y ese significado está en el
   diccionario de abajo.
2. **Codificación triple.** Ningún estado se comunica solo con color: siempre color _más_ ícono
   _más_ texto.
3. **Cero dependencia del audio.** Nunca un sonido como señal, nunca video sin subtítulos.

> **Consecuencia para el design system:**
>
> Un componente nuevo no puede introducir un color «porque queda bien». Si un color no está en el
> diccionario, no entra. Si un estado necesita comunicarse, necesita las tres capas. Esto **no es
> una preferencia estética** que se pueda revisar en un rediseño: es la razón por la que el producto
> sirve.

## Paleta

Los valores canónicos viven en `oklch` en `apps/web/src/index.css`. Los hexadecimales son su
equivalencia, ya verificada en contraste WCAG.

### Modo claro

| Token                | Hex       | Significa                                                                        |
| -------------------- | --------- | -------------------------------------------------------------------------------- |
| `--primary`          | `#054DAE` | Acción principal, y «lo tuyo». Nunca decoración.                                 |
| `--primary-hover`    | `#053B87` | Estado hover de la acción principal.                                             |
| `--primary-soft`     | `#F0F7FD` | Fondo de chips y estados propios del usuario.                                    |
| `--attention`        | `#EEAE25` | **TIEMPO:** urgencia, ventana temporal, escasez de cupos. Jamás marca ni adorno. |
| `--attention-soft`   | `#FCF1D2` | Versión suave del ámbar, para estados no inminentes.                             |
| `--attention-border` | `#F4CB75` | Borde del ámbar suave.                                                           |
| `--success`          | `#116E4D` | Confirmado, disponible, completado.                                              |
| `--success-soft`     | `#D8F7E8` | Versión suave del verde.                                                         |
| `--destructive`      | `#A61C23` | Pérdida o error. Nunca para advertir de tiempo.                                  |
| `--destructive-soft` | `#FDE8E6` | Versión suave del rojo.                                                          |
| `--foreground`       | `#131E30` | Tinta azulada, deliberadamente no negro puro.                                    |
| `--muted-foreground` | `#566374` | Texto secundario: metadatos, ayudas.                                             |
| `--muted`            | `#EDF4FB` | Inactivo, pasado, sin acción posible.                                            |
| `--background`       | `#FAFCFE` | Fondo de página.                                                                 |
| `--card`             | `#FFFFFF` | Fondo de tarjeta. La jerarquía se hace con borde, no con sombra.                 |
| `--ring`             | `#1364CE` | Anillo de foco.                                                                  |

### Modo oscuro

El mismo diccionario de significados, con los valores desplazados. El ámbar sigue siendo tiempo y el
verde sigue siendo confirmación: **un token nunca cambia de significado entre temas.**

| Token                | Hex       | Significa                          |
| -------------------- | --------- | ---------------------------------- |
| `--background`       | `#111721` | Fondo de página.                   |
| `--card`             | `#1B232F` | Fondo de tarjeta.                  |
| `--foreground`       | `#F0F4F9` | Texto principal.                   |
| `--muted-foreground` | `#A5B1C0` | Texto secundario. Contraste 8.2:1. |
| `--primary`          | `#65A8F7` | Acción principal.                  |
| `--attention`        | `#F3BE55` | Tiempo.                            |
| `--ring`             | `#84BBFE` | Anillo de foco.                    |

> **Nota de estado (agosto 2026).** Existió un tercer tema de alto contraste. Se eliminó como
> decisión de producto al cerrar la Fase 1: **quedan claro y oscuro**. Parte de la documentación
> técnica todavía lo menciona y está pendiente de limpieza. El design system debe partir de dos
> temas, no de tres.

### Reglas de contraste

- Texto: **7:1 (AAA)** siempre que sea posible; 4.5:1 como mínimo absoluto.
- Bordes y gráficos que llevan significado: 3:1 como mínimo.
- El verde y el ámbar se eligieron para distinguirse entre sí **también en daltonismo**.
- Cero colores literales en el código. Se usa el token, nunca el hexadecimal.

## Tipografía

| Decisión                | Valor                                 | Por qué                                                                                              |
| ----------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Familia                 | Geist Variable                        | Alta legibilidad en pantalla, formas abiertas, buen contraste entre caracteres similares.            |
| Cuerpo                  | **17 px**                             | No 16. Se lee español como puente hacia el inglés, y ese esfuerzo extra merece un cuerpo mayor.      |
| Interlineado del cuerpo | 1.65                                  | Aire suficiente para leer sin perder la línea.                                                       |
| Ancho de párrafo        | Máximo 65 caracteres                  | Por encima de eso el ojo pierde el renglón al volver.                                                |
| Jerarquía               | Por peso y tamaño                     | Nunca por color: el color ya está ocupado significando otra cosa.                                    |
| Peso mínimo             | 400                                   | Pesos ligeros reducen legibilidad y están prohibidos.                                                |
| Prohibido               | `text-justify` · mayúsculas en frases | El justificado crea ríos que dificultan el seguimiento; las mayúsculas sostenidas se leen más lento. |

Escala completa: 13 px metadatos · 15 px etiquetas y ayudas · **17 px cuerpo** · 19 px entradilla ·
22 px h3 · 28 px h2 · 34 px h1 · 44 px hero.

## Espaciado y forma

- Escala de 4 y 8. Sin valores arbitrarios.
- Radios: 12 px en controles, 16 px en tarjetas, completo en chips y avatares.
- **Elevación por borde antes que por sombra.** La sombra se reserva a capas flotantes.
- Objetivos táctiles de 44 px como mínimo, 48 px en acciones primarias y en móvil.
- Rejilla de 1, 2 o 3 columnas. **Nunca cuatro.** Contenedor máximo de 1152 px.
- Navegación siempre en barra superior. Nunca lateral, nunca menú hamburguesa: un destino escondido
  es un destino que no existe.

## La firma visual: el riel de estado

> **Una franja vertical de 4 px en el borde izquierdo de cada tarjeta, con el color del estado de la
> clase.**
>
> Es redundante con la etiqueta de estado _a propósito_. Permite escanear una lista entera con
> visión periférica, sin leer, y es el elemento que hace que el producto se reconozca de un vistazo.
> **Si el design system conserva un solo rasgo visual, conserva este.**

En listas largas la tarjeta se convierte en fila y pierde las esquinas redondeadas, pero el riel se
mantiene siempre.

## El diccionario de estados

Nueve estados, cada uno con su color, su ícono y su texto. Ninguno es una columna en la base de
datos: todos se **derivan** del estado de la clase, el contador de cupos, la hora actual y la
reserva de quien mira.

| Estado                  | Color                  | Ícono          | Texto visible           |
| ----------------------- | ---------------------- | -------------- | ----------------------- |
| disponible              | `success-soft`         | CircleCheck    | Hay cupo                |
| últimos cupos           | `attention-soft`       | TriangleAlert  | Quedan {n} cupos        |
| llena                   | `muted`                | Users          | Sin cupos               |
| reservada               | `primary-soft`         | BookmarkCheck  | Tienes tu cupo          |
| **acceso abierto**      | **`attention` SÓLIDO** | DoorOpen       | **Ya puedes entrar**    |
| **en curso**            | **`success` SÓLIDO**   | Video          | **Clase en curso**      |
| finalizada              | `muted`                | CircleCheckBig | Clase finalizada        |
| cancelada               | `destructive-soft`     | CircleX        | Clase cancelada         |
| pendiente de aprobación | `attention-soft`       | Clock          | Pendiente de aprobación |

> **La regla del sólido.** Solo dos de los nueve estados van en color pleno: **acceso abierto** y
> **en curso**. Son los únicos que exigen actuar ahora mismo. Elevar cualquier otro a sólido rompe
> la jerarquía y hace que dejen de destacar los que importan.

## El componente que sostiene el producto

La **ventana de acceso** es la regla de negocio central hecha interfaz: el enlace de la clase se
revela 30 minutos antes, y solo a quien tiene reserva. Tiene cinco fases, y la transición a
«abierto» dispara una **alerta visual** — que es el reemplazo accesible de un sonido de aviso.

| Fase                   | Qué ve el usuario                                                          |
| ---------------------- | -------------------------------------------------------------------------- |
| Sin reserva            | **Reserva para acceder** — «El enlace solo se muestra a quien tiene cupo.» |
| Faltan más de 30 min   | **El acceso abre 30 minutos antes** — cuenta atrás y hora exacta.          |
| Faltan menos de 30 min | **El acceso abre en {mm}:{ss}** — barra de progreso.                       |
| Abierto                | **Ya puedes entrar** — botón grande de entrar a la clase.                  |
| Terminada              | **Esta clase ya terminó** — enlace al historial.                           |

## Prohibiciones

Se listan porque cada una fue una tentación real en algún momento del desarrollo.

- Sonido como señal de cualquier cosa.
- Video sin subtítulos, y cualquier reproducción automática.
- Placeholder como única etiqueta de un campo.
- Texto sobre imagen o sobre degradado.
- **Ámbar decorativo.** El ámbar es tiempo, y solo tiempo.
- Deshabilitar un control sin explicar por qué.
- Porcentajes o gráficas circulares para los cupos: siempre el conteo literal.
- Mostrar algo como confirmado antes de que el servidor lo confirme.

---

# Parte V · Qué hace BigHearts hoy

Esta parte es el inventario de lo que el producto hace **de verdad**, con la Fase 1 entregada. Es la
única lista de la que puede salir una afirmación pública.

## Para el estudiante

- Se registra indicando su nivel de pérdida auditiva y su preferencia de comunicación.
- Explora el catálogo de clases y filtra por nivel de inglés y por fecha.
- Ve marcadas las clases que coinciden con su preferencia de comunicación.
- Reserva su cupo, con la garantía de que nadie puede ocuparlo por encima del aforo.
- Ve sus próximas clases en su panel de inicio y en su listado propio.
- Cancela hasta una hora antes, liberando el cupo para otra persona.
- Recibe correo al reservar, al cancelar, si su clase se cancela, 24 horas antes y 30 minutos antes.
- Accede al enlace de la videollamada cuando se habilita, 30 minutos antes.
- Consulta su historial: a qué asistió, a qué no y qué canceló.

## Para el profesor

- Se registra y espera aprobación del administrador antes de poder enseñar.
- Crea aulas con título, descripción, nivel, horario, duración y cupo, y pega su propio enlace de
  Zoom o Meet.
- Declara cómo se imparte la clase: modos de comunicación, intérprete, subtítulos en vivo y
  materiales visuales.
- Duplica un aula existente para no volver a llenar once campos.
- Edita y cancela sus aulas; si tiene reservas, se avisa a cada estudiante afectado.
- Ve quién viene a su clase, con el perfil de accesibilidad de cada estudiante y un resumen del
  grupo.
- Marca la asistencia cuando la clase termina, y puede corregirla.
- Consulta el historial de sus clases impartidas, con inscritos y asistentes.

## Para el administrador

- Aprueba o rechaza las solicitudes de los profesores.
- Supervisa todas las aulas de la academia, de todos los profesores, incluidas canceladas y pasadas,
  en solo lectura.

## Las cuatro reglas que hacen la diferencia

Concentran el valor del producto. Son las que se pueden contar en una landing sin exagerar nada.

| Regla                           | Qué significa para el usuario                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| El enlace es privado y temporal | Se guarda cifrado y solo se revela a quien tiene reserva confirmada, dentro de los 30 minutos previos.         |
| El cupo es real                 | Si dos estudiantes intentan tomar el último lugar a la vez, exactamente uno lo obtiene. Nunca se vende de más. |
| Cancelar libera el cupo         | Cancelar hasta una hora antes devuelve ese lugar al catálogo de inmediato.                                     |
| Sin clases solapadas            | Nadie puede reservar dos clases a la misma hora, así que el historial refleja algo que pudo ocurrir de verdad. |

## Lo que todavía no hace

> **Esta lista es tan importante como la anterior.** Nada de lo que sigue puede aparecer en la
> landing, ni en una demo, ni en una conversación con el cliente, como si existiera.

- **No hay pagos ni suscripciones.** El control de acceso habilita cobrar más adelante, pero hoy no
  se cobra.
- **No hay aplicación móvil.** La web es responsive; no hay app nativa.
- **No hay contenido ni lecciones** dentro de la plataforma. Enseña el profesor, en la videollamada.
- **No hay traducción a lengua de señas ni subtitulado automático.** Los subtítulos en vivo, si los
  hay, los aporta el profesor y la plataforma solo los _declara_.
- **No hay mensajería** entre usuarios.
- **No hay certificados** ni estadísticas de progreso.
- **No hay lista de espera** cuando una clase se llena.
- La plataforma está desplegada en un **entorno de pruebas**. El corte a producción es un paso
  posterior.

---

# Parte VI · La landing page

La landing es donde BigHearts se muestra al mundo. Por eso es también donde más fácil sería mentir:
basta un titular ambicioso para prometer algo que la plataforma no hace.

> **Criterio de aceptación de la landing**
>
> Cada afirmación tiene que poder señalarse a una función de la Parte V. Si una frase no se puede
> trazar, se reescribe o se borra. Un usuario sordo que llega esperando subtitulado automático y
> encuentra una plataforma de reservas **se lleva exactamente la decepción que este producto existe
> para evitar**.

## Estructura propuesta

Ocho bloques, en este orden. El copy está redactado para usarse tal cual.

### 1 · Hero

> **Titular:** Tu clase de inglés, en un lugar que sí es tuyo.
>
> **Subtítulo:** BigHearts es una academia de inglés en línea para personas sordas e hipoacúsicas.
> Reservas tu cupo, sabes que es tuyo, y entras a la clase cuando llega la hora — sin buscar el
> enlace en un chat.
>
> **Acción principal:** Ver las clases disponibles
> **Acción secundaria:** Soy profesor

Sin imagen de fondo con texto encima: **está prohibido**. La ilustración, si la hay, es geométrica y
construida con los mismos rectángulos y rieles del producto.

### 2 · El problema, en dos columnas

Es el bloque que más convence porque no vende: describe.

| Hoy, con WhatsApp                              | Con BigHearts                                           |
| ---------------------------------------------- | ------------------------------------------------------- |
| El enlace circula libre; entra quien lo tenga. | Solo entra quien reservó, y solo 30 minutos antes.      |
| El profesor no sabe cuántos vendrán.           | El profesor ve su lista de inscritos antes de la clase. |
| No queda registro de asistencia.               | Cada clase deja historial para estudiante y profesor.   |
| El estudiante depende de revisar el chat.      | Recibe confirmación y recordatorios por correo.         |
| Las herramientas asumen que el usuario oye.    | Toda la experiencia es visual, clara y accesible.       |

### 3 · Cómo funciona, en tres pasos

> **1. Encuentras tu clase.** Filtra por nivel y por fecha. Cada clase dice cuántos cupos quedan y
> cómo se imparte.
>
> **2. Reservas tu cupo.** Si aparece disponible, es porque lo está. Nunca se reservan más lugares
> de los que hay.
>
> **3. Entras a la clase.** El enlace aparece 30 minutos antes, en tu pantalla, sin que tengas que
> pedírselo a nadie.

### 4 · Cada clase dice cómo se imparte

Es el bloque **más diferencial** de la landing y el que ninguna plataforma genérica puede copiar sin
rehacerse.

> **Titular:** Sabes cómo es la clase antes de entrar.
>
> **Cuerpo:** Cada clase declara en qué modos se imparte —lengua de señas, lectura labial, texto
> escrito, audio— y si tiene intérprete, subtítulos en vivo o materiales visuales. Cuando dices cómo
> prefieres comunicarte, el catálogo te marca las clases que coinciden contigo.

> **Cuidado con este bloque.** La plataforma **no provee** intérprete ni subtítulos: los **declara**
> el profesor. El copy dice «declara», nunca «incluye» ni «ofrece». La diferencia entre esas dos
> palabras es la diferencia entre informar y prometer.

### 5 · Lo que hace distinta a la plataforma

Las cuatro reglas, en lenguaje de persona:

- **Tu cupo es tuyo.** Si dos personas piden el último lugar a la vez, solo una lo obtiene. Nunca
  hay más reservas que sillas.
- **El enlace no circula.** Se guarda cifrado y solo lo ve quien reservó, 30 minutos antes de
  empezar.
- **Si no puedes ir, avisas.** Cancelas hasta una hora antes y tu lugar queda libre para alguien
  más.
- **No puedes reservar dos clases a la misma hora.** Tu historial refleja lo que de verdad pudo
  pasar.

### 6 · Para profesores

> **Titular:** Sabes quién viene y cómo se comunica.
>
> **Cuerpo:** Creas tu aula, pegas tu enlace de Zoom o Meet, y la plataforma se encarga del resto:
> los cupos, los recordatorios y el acceso. Antes de empezar ves tu lista de inscritos con la
> preferencia de comunicación de cada uno, para preparar la clase para las personas que vas a tener
> delante.
>
> **Acción:** Crear mi cuenta de profesor

Debajo del botón, una línea que evita una frustración: **«Las cuentas de profesor las aprueba la
academia antes de poder publicar clases.»** Es información que el usuario necesita _antes_ de
registrarse, no después.

### 7 · Accesibilidad, dicho sin adornos

> **Titular:** Construido para no oír, no adaptado después.
>
> **Cuerpo:** Ningún aviso depende del sonido. Cada estado se comunica con color, ícono y texto a la
> vez. Toda la plataforma se recorre con teclado, funciona en modo claro y oscuro, y las horas
> siempre se muestran completas y con su zona.

### 8 · Cierre

> **Titular:** Aprender inglés no debería ser más difícil por no poder oír.
>
> **Acción:** Ver las clases disponibles

## Lo que la landing no puede decir

| No escribir                                     | Porque                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| «Clases con intérprete de señas»                | La plataforma no provee intérprete. Lo declara el profesor, clase por clase. |
| «Subtítulos automáticos»                        | No existen. Los subtítulos en vivo, si los hay, los pone el profesor.        |
| «Aprende a tu ritmo» · «Lecciones interactivas» | No hay contenido dentro de la plataforma. Enseña una persona, en vivo.       |
| «Descarga la app»                               | No hay aplicación móvil. La web es responsive.                               |
| «Planes desde $X»                               | No hay pagos implementados.                                                  |
| «Certificado al terminar»                       | No existen certificados.                                                     |
| «Te avisamos por WhatsApp»                      | Los avisos son por correo, y solo por correo.                                |

## Nota sobre el momento de publicar

> La plataforma está hoy en un **entorno de pruebas**. Mientras el corte a producción no ocurra, los
> botones de la landing no pueden llevar a un registro que la academia no puede atender. Si la
> landing sale antes, su acción debe ser **dejar un correo de contacto** — nunca «Crear mi cuenta».

---

# Anexo · Trazabilidad

Cada afirmación pública del documento, contra la función que la respalda. Es lo que permite auditar
la landing sin abrir el código.

| Afirmación                                                     | Respaldo                                                                                                                                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| «Solo entra quien reservó, 30 minutos antes»                   | El enlace se guarda cifrado con AES-256-GCM y se revela solo con reserva confirmada, dentro de la ventana. Decidido en el servidor.                                  |
| «Nunca hay más reservas que sillas»                            | Transacción con bloqueo de fila sobre el aula. Verificado con pruebas de dos reservas simultáneas por el último cupo.                                                |
| «Cancelas hasta una hora antes y tu lugar queda libre»         | La cancelación libera el cupo en la misma transacción. Ventana configurable, una hora por defecto.                                                                   |
| «No puedes reservar dos clases a la misma hora»                | Validación de solapamiento dentro de la transacción de reserva.                                                                                                      |
| «Cada clase declara cómo se imparte»                           | El aula registra modos de comunicación, intérprete, subtítulos en vivo y materiales visuales. El catálogo marca las coincidencias con la preferencia del estudiante. |
| «Recibes confirmación y recordatorios por correo»              | Cinco avisos transaccionales más recordatorios de 24 horas y 30 minutos, con marcas que impiden duplicados.                                                          |
| «Ves tu lista de inscritos con su preferencia de comunicación» | Listado de inscritos por aula, restringido al profesor dueño, con resumen de accesibilidad del grupo. Sin correo del estudiante.                                     |
| «Cada clase deja historial»                                    | Asistencia marcada manualmente por el profesor al terminar, consultable por estudiante y profesor.                                                                   |
| «Se recorre con teclado y funciona en claro y oscuro»          | Recorrido completo verificado sin ratón en la pasada de cierre de la Fase 1.                                                                                         |
