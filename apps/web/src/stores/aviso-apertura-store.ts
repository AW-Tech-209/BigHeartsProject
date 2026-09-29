import { create } from 'zustand';

const CLAVE_PREFERENCIA = 'bighearts:avisar-en-navegador';

function leerPreferencia(): boolean {
  try {
    return localStorage.getItem(CLAVE_PREFERENCIA) === '1';
  } catch {
    return false;
  }
}

export type AvisoApertura = {
  classroomId: string;
  titulo: string;
  /** ISO 8601 UTC: cuándo termina la clase y el aviso deja de tener sentido. */
  terminaEn: string;
};

type AvisoAperturaState = {
  /** Clases (por `id`) que el servidor aún respondía cerradas. */
  esperando: Record<string, true>;
  /** Aperturas ya avisadas: un aviso por apertura, no uno por pantalla. */
  avisadas: Record<string, true>;
  aviso: AvisoApertura | null;
  notificarEnNavegador: boolean;
  esperar: (clave: string) => void;
  /** `true` solo si esta apertura era nueva: quien llama decide si además notifica. */
  abrir: (clave: string, aviso: AvisoApertura) => boolean;
  descartar: () => void;
  setNotificarEnNavegador: (valor: boolean) => void;
};

/** Vive en un store y no en el hook porque `<AppShell>` se remonta en cada pantalla. */
export const useAvisoAperturaStore = create<AvisoAperturaState>()((set, get) => ({
  esperando: {},
  avisadas: {},
  aviso: null,
  notificarEnNavegador: leerPreferencia(),

  // Que el servidor la diga cerrada la vuelve a armar: una reprogramada avisa de nuevo.
  esperar: (clave) => {
    const { esperando, avisadas } = get();
    if (esperando[clave] && !avisadas[clave]) return;
    const restantes = { ...avisadas };
    delete restantes[clave];
    set({ esperando: { ...esperando, [clave]: true }, avisadas: restantes });
  },

  abrir: (clave, aviso) => {
    const { esperando, avisadas } = get();
    if (!esperando[clave] || avisadas[clave]) return false;
    set((s) => ({ avisadas: { ...s.avisadas, [clave]: true }, aviso }));
    return true;
  },

  descartar: () => {
    if (get().aviso) set({ aviso: null });
  },

  setNotificarEnNavegador: (valor) => {
    try {
      localStorage.setItem(CLAVE_PREFERENCIA, valor ? '1' : '0');
    } catch {
      // Sin almacenamiento la preferencia vale solo para esta pestaña.
    }
    set({ notificarEnNavegador: valor });
  },
}));
