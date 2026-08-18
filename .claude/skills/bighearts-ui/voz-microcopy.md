# Voz y microcopy — BigHearts

El texto es la interfaz. Se escribe con la misma disciplina que el espaciado.

- **Español neutro, sin regionalismos.** Frases cortas: máximo ~15 palabras.
- **Literal, nunca figurado.** Muchos usuarios tienen la lengua de señas como primer idioma y el
  español escrito como segundo. Nada de "¡Ups!", "se nos fue el avión", "en un abrir y cerrar de ojos".
- **Voz activa y el mismo verbo en todo el flujo.** El botón dice `Reservar mi cupo` → el toast dice
  `Cupo reservado`. Nunca `Enviar`, nunca `Aceptar` a secas.
- **Los errores no se disculpan, explican.**
  - ✅ `No pudimos guardar tu reserva. Revisa tu conexión e inténtalo otra vez.`
  - ❌ `¡Ups! Algo salió mal 😅`
- **Los vacíos invitan a actuar.**
  - ✅ `Todavía no tienes clases reservadas. Explora las aulas disponibles.` + botón.
  - ❌ `Sin resultados.`
- **Nombra lo que el usuario controla, no cómo está construido.** `Recordatorios por correo`,
  no `Configuración de notificaciones SMTP`.
- Sentence case en todo: botones, títulos, labels y menús. Nunca Title Case en español.
- Fechas y horas siempre completas y explícitas: `Martes 12 de agosto, 6:00 p.m. (hora de Colombia)`.
  Nunca `12/08` solo. Nunca formato relativo como única información (`en 2 días` va acompañado de la fecha).

## Toasts

Mínimo 8 segundos visibles y siempre con botón de cerrar — el usuario no puede "oír" que algo pasó
mientras mira otra parte de la pantalla. Los mensajes críticos no se auto-cierran.

## Estados de carga

Siempre con texto, nunca un spinner mudo: `Cargando aulas disponibles…`.
