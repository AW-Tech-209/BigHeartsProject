let irA: ((ruta: string) => void) | null = null;

/** El `<AppShell>` vivo registra aquí cómo navegar; la notificación sobrevive a sus remontajes. */
export function registrarNavegacion(fn: ((ruta: string) => void) | null) {
  irA = fn;
}

export function navegadorSoportaNotificaciones(): boolean {
  return typeof Notification !== 'undefined';
}

export type ResultadoPermiso = 'concedido' | 'denegado' | 'no-soportado';

/** Pide el permiso. Solo se llama desde el gesto del usuario en el interruptor del perfil. */
export async function pedirPermisoDeNotificacion(): Promise<ResultadoPermiso> {
  if (!navegadorSoportaNotificaciones()) return 'no-soportado';
  if (Notification.permission === 'granted') return 'concedido';
  if (Notification.permission === 'denied') return 'denegado';
  return (await Notification.requestPermission()) === 'granted' ? 'concedido' : 'denegado';
}

export function mostrarNotificacionDeApertura(classroomId: string, titulo: string) {
  if (!navegadorSoportaNotificaciones() || Notification.permission !== 'granted') return;

  const notificacion = new Notification('Tu clase ya abrió', {
    body: titulo,
    tag: `apertura-${classroomId}`,
  });
  notificacion.onclick = () => {
    window.focus();
    const ruta = `/aulas/${classroomId}`;
    if (irA) irA(ruta);
    else window.location.assign(ruta);
    notificacion.close();
  };
}
