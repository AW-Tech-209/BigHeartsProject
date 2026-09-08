import { QueryClient } from '@tanstack/react-query';

/** 30 s por defecto: sin esto, cada montaje y cada foco de ventana repetía toda petición. */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});
