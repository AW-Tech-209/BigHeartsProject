import { describe, expect, it } from 'vitest';

import { coincideConLaPreferencia } from './accesibilidad-aula';
import { CommunicationPreference } from './index';

describe('coincideConLaPreferencia', () => {
  it('sin modos declarados, no hay coincidencia', () => {
    expect(
      coincideConLaPreferencia({ communicationModes: [] }, CommunicationPreference.SIGN_LANGUAGE),
    ).toBe(false);
  });

  it('el modo del aula coincide con la preferencia del estudiante', () => {
    expect(
      coincideConLaPreferencia(
        { communicationModes: [CommunicationPreference.SIGN_LANGUAGE] },
        CommunicationPreference.SIGN_LANGUAGE,
      ),
    ).toBe(true);
  });

  it('el aula declara varios modos: coincide si la preferencia está entre ellos', () => {
    expect(
      coincideConLaPreferencia(
        {
          communicationModes: [
            CommunicationPreference.SIGN_LANGUAGE,
            CommunicationPreference.WRITTEN_TEXT,
          ],
        },
        CommunicationPreference.WRITTEN_TEXT,
      ),
    ).toBe(true);
  });

  it('ninguno de los modos del aula coincide con la preferencia', () => {
    expect(
      coincideConLaPreferencia(
        { communicationModes: [CommunicationPreference.LIP_READING] },
        CommunicationPreference.SIGN_LANGUAGE,
      ),
    ).toBe(false);
  });

  it('sin preferencia declarada (undefined), no hay coincidencia posible', () => {
    expect(
      coincideConLaPreferencia(
        { communicationModes: [CommunicationPreference.SIGN_LANGUAGE] },
        undefined,
      ),
    ).toBe(false);
  });

  it('sin preferencia declarada (null), no hay coincidencia posible', () => {
    expect(
      coincideConLaPreferencia(
        { communicationModes: [CommunicationPreference.SIGN_LANGUAGE] },
        null,
      ),
    ).toBe(false);
  });
});
