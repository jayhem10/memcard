'use client';

import { useEffect } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { PublicGuard } from '@/components/auth/public-guard';

export default function LoginPage() {
  return (
    <PublicGuard>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left side - Image */}
        <div className="hidden md:flex md:w-1/2 bg-primary relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/50">
            <div className="flex flex-col justify-center items-center h-full text-primary-foreground p-8">
              <h1 className="text-4xl font-bold mb-4">MemCard</h1>
              <p className="text-xl text-center max-w-md">
                Gérez votre collection de jeux vidéo en toute simplicité
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8">
          {/* Logo for mobile */}
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">MemCard</h1>
            <p className="text-muted-foreground">
              Gérez votre collection de jeux vidéo
            </p>
          </div>

          <AuthForm />
        </div>
      </div>
    </PublicGuard>
  );
}
