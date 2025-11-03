// src/app/(authenticated)/layout.tsx
'use client';

import { useEffect } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { BottomNavbar } from '@/components/layout/bottom-navbar';
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
      // Définir le type pour les données de jeux
      type GameWithPrice = {
        buy_price: number | null;
      };
      
      const { data: games } = await supabase
        .from('user_games')
        .select('buy_price')
        .eq('user_id', user.id)
        .returns<GameWithPrice[]>();

      if (games) {
        // Transformer les données pour s'assurer que buy_price est toujours un nombre
        const gamesWithValidPrices = games.map(game => ({
          buy_price: typeof game.buy_price === 'number' ? game.buy_price : 0
        }));
        
        calculateTotalFromGames(gamesWithValidPrices);
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
        <main className="flex-1 container mx-auto px-4 py-8 pb-20 md:pb-8">
          {children}
        </main>
        <Footer />
        <BottomNavbar />
      </div>
    </AuthGuard>
  );
}