'use client';

import { AuthForm } from '@/components/auth/auth-form';
import { PublicGuard } from '@/components/auth/public-guard';
import { LoginHero } from '@/components/auth/login-hero';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <PublicGuard>
      <div className="min-h-screen flex flex-col md:flex-row relative">
        {/* Left side - Theme-aware hero section */}
        <LoginHero />

        {/* Right side - Auth form */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative z-10">
          {/* Logo for mobile */}
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">MemCard</h1>
            <p className="text-muted-foreground">
              {t('manageCollection')}
            </p>
          </div>

          <AuthForm />
        </div>
      </div>
    </PublicGuard>
  );
}
