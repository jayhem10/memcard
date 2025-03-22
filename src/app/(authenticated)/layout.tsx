// src/app/(authenticated)/layout.tsx
'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/layout/navbar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}