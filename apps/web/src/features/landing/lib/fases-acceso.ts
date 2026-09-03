import { CircleCheckBig, Clock, DoorOpen, Lock, type LucideIcon } from 'lucide-react';

/**
 * Las cinco fases de la ventana de acceso (`bighearts-ui`, «El componente que
 * sostiene el producto»), con el copy exacto que ve el estudiante en cada una.
 * La landing las reproduce —con el contador corriendo— para enseñar la regla
 * central del producto: el enlace se revela 30 minutos antes y solo a quien
 * reservó.
 */
export type TonoFase = 'muted' | 'info' | 'attention' | 'attention-solido';

/** Qué elemento vivo lleva el panel de cada fase. */
export type RelojFase = 'ninguno' | 'cuenta-larga' | 'cuenta-corta' | 'boton';

export type FaseAcceso = {
  id: string;
  paso: string;
  /** Etiqueta corta para la lista de fases de la izquierda. */
  nombre: string;
  icon: LucideIcon;
  /** Encabezado del panel: «Fase 3 · faltan menos de 30 minutos». */
  fase: string;
  titular: string;
  cuerpo: string;
  tono: TonoFase;
  reloj: RelojFase;
  /** Cuánto se muestra esta fase cuando la demostración corre sola. */
  durMs: number;
  /** Al entrar en esta fase el panel pulsa una vez (el reemplazo del «ding»). */
  pulsa: boolean;
};

export const FASES_ACCESO: FaseAcceso[] = [
  {
    id: 'sin-reserva',
    paso: '01',
    nombre: 'Sin reserva',
    icon: Lock,
    fase: 'Fase 1 · sin reserva',
    titular: 'Reserva para acceder',
    cuerpo: 'El enlace solo se muestra a quien tiene cupo.',
    tono: 'muted',
    reloj: 'ninguno',
    durMs: 3200,
    pulsa: false,
  },
  {
    id: 'faltan-mas-30',
    paso: '02',
    nombre: 'Faltan más de 30 minutos',
    icon: Clock,
    fase: 'Fase 2 · faltan más de 30 minutos',
    titular: 'El acceso abre 30 minutos antes',
    cuerpo:
      'Tu clase empieza el martes 12 de agosto a las 6:00 p. m. (hora de Colombia). El enlace aparecerá aquí a las 5:30 p. m.',
    tono: 'info',
    reloj: 'cuenta-larga',
    durMs: 5200,
    pulsa: false,
  },
  {
    id: 'faltan-menos-30',
    paso: '03',
    nombre: 'Faltan menos de 30 minutos',
    icon: Clock,
    fase: 'Fase 3 · faltan menos de 30 minutos',
    titular: 'El acceso abre en',
    cuerpo:
      'Quédate en esta pantalla o vuelve más tarde. El enlace aparece aquí solo, sin recargar.',
    tono: 'attention',
    reloj: 'cuenta-corta',
    durMs: 9000,
    pulsa: true,
  },
  {
    id: 'abierto',
    paso: '04',
    nombre: 'Acceso abierto',
    icon: DoorOpen,
    fase: 'Fase 4 · acceso abierto',
    titular: 'Ya puedes entrar',
    cuerpo: 'Tu cupo está confirmado. Este botón abre la videollamada del profesor.',
    tono: 'attention-solido',
    reloj: 'boton',
    durMs: 6000,
    pulsa: true,
  },
  {
    id: 'terminada',
    paso: '05',
    nombre: 'La clase terminó',
    icon: CircleCheckBig,
    fase: 'Fase 5 · la clase terminó',
    titular: 'Esta clase ya terminó',
    cuerpo: 'Tu asistencia quedó registrada cuando el profesor la marcó.',
    tono: 'muted',
    reloj: 'ninguno',
    durMs: 3600,
    pulsa: false,
  },
];

/** La fase en un índice cualquiera, con envoltura circular. Nunca `undefined`. */
export function faseAccesoEn(indice: number): FaseAcceso {
  const total = FASES_ACCESO.length;
  const seguro = ((indice % total) + total) % total;
  const fase = FASES_ACCESO[seguro];
  if (!fase) throw new Error('FASES_ACCESO no puede estar vacío');
  return fase;
}

/** `9660` → `2:41:00`; `875` → `14:35`. */
export function formatearCuenta(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const dd = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dd(m)}:${dd(r)}` : `${dd(m)}:${dd(r)}`;
}

/**
 * Estado del panel derivado del tiempo transcurrido en la fase. Concentra aquí
 * la aritmética del reloj para que el componente solo pinte.
 */
export function relojDeFase(fase: FaseAcceso, transcurridoMs: number) {
  if (fase.reloj === 'cuenta-larga') {
    const segundos = Math.max(1808, 9660 - (transcurridoMs / 1000) * 21);
    return { cuenta: formatearCuenta(segundos), progreso: 0 };
  }
  if (fase.reloj === 'cuenta-corta') {
    const p = Math.min(transcurridoMs / fase.durMs, 1);
    return { cuenta: formatearCuenta(1750 * (1 - p)), progreso: Math.round(p * 100) };
  }
  return { cuenta: '', progreso: 0 };
}
