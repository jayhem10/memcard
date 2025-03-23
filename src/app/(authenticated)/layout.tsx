// src/app/(authenticated)/layout.tsx
'use client';

import { useEffect } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/layout/navbar';
import { supabase } from '@/lib/supabase';
import { useCollectionStore } from '@/store/useCollectionStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useAuth } from '@/context/auth-context';

function DataInitializer() {
  const { calculateTotalFromGames, setUserId, reset } = useCollectionStore();
  const { fetchProfile } = useProfileStore();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCollectionValue = async () => {
      if (!user) {
        reset();
        return;
      }

      setUserId(user.id);
      const { data: games } = await supabase
        .from('user_games')
        .select('buy_price')
        .eq('user_id', user.id);

      if (games) {
        calculateTotalFromGames(games);
      }
    };

    fetchCollectionValue();
  }, [calculateTotalFromGames, setUserId, reset, user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  return null;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <DataInitializer />
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}