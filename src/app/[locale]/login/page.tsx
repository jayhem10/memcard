'use client';

import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { PublicGuard } from '@/components/auth/public-guard';
import { LoginHero } from '@/components/auth/login-hero';
import { useTranslations } from 'next-intl';
import { Library, TrendingUp, Heart, Trophy, Users, Gamepad2 } from 'lucide-react';

const FEATURES = [
  { key: 'catalog', icon: Library },
  { key: 'value', icon: TrendingUp },
  { key: 'wishlist', icon: Heart },
  { key: 'achievements', icon: Trophy },
  { key: 'friends', icon: Users },
  { key: 'platforms', icon: Gamepad2 },
] as const;

export default function LoginPage() {
  const t = useTranslations('auth');
  const tSeo = useTranslations('seo');

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

          <Suspense fallback={null}>
            <AuthForm />
          </Suspense>

          <section aria-labelledby="memcard-features" className="mt-10 w-full max-w-md">
            <h2 id="memcard-features" className="text-lg font-semibold text-center mb-2">
              {tSeo('featuresTitle')}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {tSeo('intro')}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/60 p-3">
                  <Icon className="h-5 w-5 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-medium">{tSeo(`features.${key}.title`)}</h3>
                    <p className="text-xs text-muted-foreground">{tSeo(`features.${key}.description`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PublicGuard>
  );
}
