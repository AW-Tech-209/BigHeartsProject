import { create } from 'zustand';

/**
 * Store global de la app. Vacío a propósito: HU-001 solo deja el cableado
 * listo (provider, devtools de navegador vía zustand) para que las próximas
 * HUs añadan aquí sus slices de estado.
 */
type AppState = Record<string, never>;

export const useAppStore = create<AppState>()(() => ({}));
