import { createContext } from 'react';

export type AnnouncerContextValue = {
  /** Envía un mensaje a la región viva (se lee sin cambiar el foco). */
  announce: (message: string) => void;
};

export const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);
