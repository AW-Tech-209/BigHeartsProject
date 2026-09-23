import { describe, expect, it } from 'vitest';

import { AllowedMeetingProvider, esProveedorPermitido } from './proveedor-reunion';

describe('esProveedorPermitido', () => {
  it.each([
    ['https://zoom.us/j/123456789', AllowedMeetingProvider.ZOOM],
    ['https://us02web.zoom.us/j/123456789?pwd=abc', AllowedMeetingProvider.ZOOM],
    ['https://acme.zoom.us/j/123456789', AllowedMeetingProvider.ZOOM],
    ['https://meet.google.com/abc-defg-hij', AllowedMeetingProvider.GOOGLE_MEET],
    [
      'https://teams.microsoft.com/l/meetup-join/19%3ameeting',
      AllowedMeetingProvider.MICROSOFT_TEAMS,
    ],
    ['https://acme.teams.microsoft.com/l/meetup-join/1', AllowedMeetingProvider.MICROSOFT_TEAMS],
  ])('%s se reconoce como %s', (url, esperado) => {
    expect(esProveedorPermitido(url)).toBe(esperado);
  });

  it.each([
    ['https://miempresa.com/reunion'],
    ['https://webex.com/meet/abc'],
    ['https://zoomfalso.com/j/123'],
    ['no-es-una-url'],
    [''],
  ])('%s no es ningún proveedor permitido', (url) => {
    expect(esProveedorPermitido(url)).toBeNull();
  });
});
