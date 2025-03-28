'use client';

import { AuthForm } from '@/components/auth/auth-form';
import { PublicGuard } from '@/components/auth/public-guard';
import { LoginHero } from '@/components/auth/login-hero';

export default function LoginPage() {
  return (
    <PublicGuard>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left side - Theme-aware hero section */}
        <LoginHero />

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
