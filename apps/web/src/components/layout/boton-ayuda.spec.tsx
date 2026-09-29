import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { leerSoporte } from '@/lib/soporte';
import { useContextoAyudaStore } from '@/stores/contexto-ayuda-store';
import { BotonAyuda } from './boton-ayuda';

const CON_AMBOS = leerSoporte({
  VITE_SUPPORT_WHATSAPP: '573001234567',
  VITE_SUPPORT_EMAIL: 'soporte@bighearts.co',
});

afterEach(() => useContextoAyudaStore.getState().setClase(null));

describe('BotonAyuda', () => {
  it('sin variables de entorno no hay botón', () => {
    renderConProviders(<BotonAyuda soporte={leerSoporte({})} />);
    expect(screen.queryByRole('button', { name: /necesitas ayuda/i })).toBeNull();
  });

  it('un valor mal escrito cuenta como ausente', () => {
    const soporte = leerSoporte({ VITE_SUPPORT_WHATSAPP: '+57 300', VITE_SUPPORT_EMAIL: 'x' });
    expect(soporte).toEqual({ whatsapp: null, correo: null });
  });

  it('el enlace de WhatsApp lleva la pantalla y la clase, sin datos personales', async () => {
    useContextoAyudaStore.getState().setClase('Inglés básico');
    const { user } = renderConProviders(<BotonAyuda soporte={CON_AMBOS} />, {
      ruta: '/aulas/abc-123',
    });

    await user.click(screen.getByRole('button', { name: '¿Necesitas ayuda?' }));
    const enlace = screen.getByRole('link', { name: /WhatsApp/ });
    const href = enlace.getAttribute('href') ?? '';

    expect(href.startsWith('https://wa.me/573001234567?text=')).toBe(true);
    const texto = decodeURIComponent(href.split('?text=')[1] ?? '');
    expect(texto).toBe(
      'Hola, necesito ayuda en BigHearts. Estoy en: Detalle de la clase · Clase: Inglés básico',
    );
    expect(texto).not.toMatch(/abc-123|@|user-|hipoacusia/i);
    expect(enlace).toHaveAccessibleName(/se abre en otra pestaña/);
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('con solo el correo, el diálogo ofrece solo esa opción', async () => {
    const { user } = renderConProviders(
      <BotonAyuda soporte={leerSoporte({ VITE_SUPPORT_EMAIL: 'soporte@bighearts.co' })} />,
    );

    await user.click(screen.getByRole('button', { name: '¿Necesitas ayuda?' }));

    expect(screen.getByRole('link', { name: /correo/ })).toHaveAttribute(
      'href',
      'mailto:soporte@bighearts.co',
    );
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).toBeNull();
  });

  it('el diálogo se abre y se cierra con teclado', async () => {
    const { user } = renderConProviders(<BotonAyuda soporte={CON_AMBOS} />);

    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('no tiene violaciones de accesibilidad con el diálogo abierto', async () => {
    const { user, baseElement } = renderConProviders(<BotonAyuda soporte={CON_AMBOS} />);
    await user.click(screen.getByRole('button', { name: '¿Necesitas ayuda?' }));
    await esperarSinFallosDeAccesibilidad(baseElement);
  });
});
