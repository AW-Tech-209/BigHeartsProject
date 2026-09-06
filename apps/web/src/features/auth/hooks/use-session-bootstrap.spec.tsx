import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refreshSessionMock = vi.fn();
vi.mock('@/lib/auth/refresh-session', () => ({
  refreshSession: () => refreshSessionMock(),
}));

async function montar({ conMarca }: { conMarca: boolean }) {
  vi.resetModules();
  const { useAuthStore } = await import('@/stores/auth-store');
  const { setSessionHint, clearSessionHint } = await import('@/lib/auth/session-hint');
  if (conMarca) setSessionHint();
  else clearSessionHint();
  const { useSessionBootstrap } = await import('./use-session-bootstrap');
  return { useAuthStore, useSessionBootstrap };
}

beforeEach(() => {
  refreshSessionMock.mockReset();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSessionBootstrap', () => {
  it('sin marca de sesión previa no llama a /auth/refresh y el estado es anonymous', async () => {
    const { useAuthStore, useSessionBootstrap } = await montar({ conMarca: false });

    renderHook(() => useSessionBootstrap());

    expect(refreshSessionMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('con marca y respuesta lenta, cae a anonymous al vencer el plazo', async () => {
    vi.useFakeTimers();
    refreshSessionMock.mockReturnValue(new Promise(() => {}));
    const { useAuthStore, useSessionBootstrap } = await montar({ conMarca: true });

    renderHook(() => useSessionBootstrap());
    expect(useAuthStore.getState().status).toBe('checking');

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(refreshSessionMock).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });
});
