# HU-524 — Pantalla de usuarios del admin y credenciales fáciles de copiar

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Piloto controlado                     |
| **Prioridad**       | 🔴 Crítica                                          |
| **Estimación**      | 1.5 días                                            |
| **Estado**          | ✅ Hecha                                            |
| **Asignada a**      | **Dev B** — frontend                                |
| **Rama**            | `hu-524-pantalla-de-usuarios-y-credenciales-b`      |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | HU-523 (contrato en `main`; la API se mockea)       |
| **Labels**          | `post-fase-1` `prioridad:critica` `frontend` `a11y` |

> **Como** administrador,
> **quiero** crear una cuenta y copiar sus credenciales con un solo botón,
> **para** pegárselas a la persona por WhatsApp sin transcribir nada ni equivocarme.

## Contexto

El admin va a crear decenas de cuentas y compartir cada una. Lo que tiene que salir de la pantalla
es **un bloque de texto listo para pegar**, no tres campos que copiar por separado. La contraseña se
muestra **una sola vez** (HU-523): si se pierde, se genera otra. Por eso el diálogo lo dice claro y
no se cierra solo.

## Referencias

- **Archivos a tocar:** `apps/web/src/pages/UsuariosPage.tsx` (nuevo),
  `apps/web/src/features/admin/{api,hooks,components,lib}/` (usuarios), `apps/web/src/app/router.tsx`,
  `apps/web/src/components/layout/destinos-por-rol.ts`.
- **Reglas:** skill `bighearts-ui` → `patrones-dominio.md` (confirmaciones), `voz-microcopy.md`,
  «Prohibido» (sin modales anidados).
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — Ruta `/admin/usuarios` (`roles={[ADMIN]}`) y destino «Usuarios» (ícono `Users`) en la
      barra del admin. Lista con filtros por rol, estado y búsqueda, en la URL. Cada fila muestra
      rol, estado y «Pendiente de primer ingreso» si aplica (color + ícono + texto).
- [x] **T2** — «Crear cuenta»: formulario con nombre, apellido, correo y rol (tarjetas «Estudiante» /
      «Profesor»), con los errores junto al campo (409 → «Ya hay una cuenta con ese correo»).
- [x] **T3** — Diálogo de credenciales (tras crear o regenerar): muestra el bloque y el aviso «Esta
      contraseña no se volverá a mostrar. Cópiala ahora». El bloque es exactamente:
      `    Hola {nombre}, esta es tu cuenta de BigHearts.
Entra en: {origen}/login
Correo: {correo}
Contraseña temporal: {contraseña}
Al entrar te pediremos crear tu propia contraseña.
Esta contraseña caduca el {fecha larga} (hora de Colombia).`
      La contraseña va en fuente mono y grande.
- [x] **T4** — Botones del diálogo: **«Copiar credenciales»** (el bloque entero, con
      `navigator.clipboard.writeText`) y «Copiar solo la contraseña». Si el portapapeles falla, el
      bloque queda seleccionado para copiar a mano, y se explica. Tras copiar, el botón dice
      «Copiado» con ícono `Check` durante 3 s y se anuncia por `aria-live`. También «Enviar por
      WhatsApp» (`https://wa.me/?text=<bloque>`: la persona elige el contacto) y «Crear otra cuenta»,
      que vuelve al formulario vacío.
- [x] **T5** — En cada fila, «Generar contraseña nueva» con confirmación («Se cerrarán sus sesiones
      abiertas»), que termina en el mismo diálogo de T3.
- [x] **T6** — Tests: el profesor no ve el destino; crear muestra el bloque con los datos exactos;
      «Copiar credenciales» llama al portapapeles con el bloque completo; cerrar el diálogo pide
      confirmar si no se copió nada; `axe` limpio.

## Criterios de aceptación

- [x] **AC1** — Tras crear una cuenta, **un solo clic** en «Copiar credenciales» deja en el
      portapapeles el bloque de T3 completo, con el origen real de la app en el enlace.
- [x] **AC2** — Si el admin intenta cerrar el diálogo sin haber copiado, se le pregunta «¿Cerrar sin
      copiar? La contraseña no se volverá a mostrar», sin abrir un segundo modal (confirmación dentro
      del mismo diálogo).
- [x] **AC3** — La contraseña no se guarda en el estado de React Query ni en `localStorage`: al cerrar
      el diálogo desaparece de memoria (se guarda solo en estado local del diálogo).
- [x] **AC4** — «Generar contraseña nueva» muestra un bloque nuevo y la lista marca al usuario como
      «Pendiente de primer ingreso».
- [x] **AC5** — Todo el flujo (crear → copiar → crear otra) se completa con teclado.

## Fuera de alcance

- Alta masiva por CSV.
- Editar datos del usuario, suspender o reactivar desde esta pantalla.

## Notas de implementación

Sin desviaciones. La contraseña sale del `mutationFn` por callback (`onCuenta`) para que no quede en la caché de React Query.
