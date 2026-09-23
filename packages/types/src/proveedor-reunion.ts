/**
 * Proveedor de videollamada permitido para el enlace de una clase (D45,
 * `ARQUITECTURA.md` §4.9). Solo estos tres: son los que ofrecen subtítulos en
 * vivo. Distinto de `MeetingProvider` (el enum viejo de `schema.prisma`, que
 * incluye `MANUAL`/`DAILY`): ese sigue existiendo para las aulas ya creadas,
 * este es el vocabulario del contrato nuevo, más estrecho a propósito.
 */
export enum AllowedMeetingProvider {
  ZOOM = 'ZOOM',
  GOOGLE_MEET = 'GOOGLE_MEET',
  MICROSOFT_TEAMS = 'MICROSOFT_TEAMS',
}

/** Etiquetas en español de `AllowedMeetingProvider` (T7). */
export const ALLOWED_MEETING_PROVIDER_LABELS: Record<AllowedMeetingProvider, string> = {
  [AllowedMeetingProvider.ZOOM]: 'Zoom',
  [AllowedMeetingProvider.GOOGLE_MEET]: 'Google Meet',
  [AllowedMeetingProvider.MICROSOFT_TEAMS]: 'Microsoft Teams',
};

const DOMINIOS_POR_PROVEEDOR: Array<[AllowedMeetingProvider, string[]]> = [
  [AllowedMeetingProvider.ZOOM, ['zoom.us', 'zoom.com']],
  [AllowedMeetingProvider.GOOGLE_MEET, ['meet.google.com']],
  [AllowedMeetingProvider.MICROSOFT_TEAMS, ['teams.microsoft.com', 'teams.live.com']],
];

function coincideConDominio(hostname: string, dominio: string): boolean {
  return hostname === dominio || hostname.endsWith(`.${dominio}`);
}

/**
 * Valida el dominio de un enlace de videollamada contra Zoom, Meet y Teams
 * —incluidos subdominios regionales y de empresa (`acme.zoom.us`,
 * `us02web.zoom.us`)— y devuelve a cuál pertenece. `null` si la URL no es
 * válida o el dominio no es ninguno de los tres (T4). Función pura: la
 * comparten el DTO del backend (HU-506) y el formulario del frontend (HU-507).
 */
export function esProveedorPermitido(url: string): AllowedMeetingProvider | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }

  for (const [proveedor, dominios] of DOMINIOS_POR_PROVEEDOR) {
    if (dominios.some((dominio) => coincideConDominio(hostname, dominio))) {
      return proveedor;
    }
  }
  return null;
}
