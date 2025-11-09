// src/app/(authenticated)/layout.tsx
'use client';

import { useEffect } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { BottomNavbar } from '@/components/layout/bottom-navbar';
import { useProfileStore } from '@/store/useProfileStore';
import { useAuth } from '@/context/auth-context';
import { AchievementNotifications } from '@/components/achievements/achievement-notifications';

function DataInitializer() {
  const { fetchProfile } = useProfileStore();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Ne dépendre que de user.id

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
        <AchievementNotifications />
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