'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { createOptimizedQueryClient } from '@/lib/react-query-config';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Créer un QueryClient optimisé avec les configurations par défaut
  // Une instance par arbre de composants client pour éviter le partage de données entre utilisateurs
  const [queryClient] = useState(() => createOptimizedQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
