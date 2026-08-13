import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { LiveAnnouncerProvider } from '@/components/live-announcer';
import { queryClient } from '@/lib/query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveAnnouncerProvider>{children}</LiveAnnouncerProvider>
    </QueryClientProvider>
  );
}
